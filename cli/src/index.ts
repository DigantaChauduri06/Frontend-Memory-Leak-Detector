import { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import * as path from "path";
import * as fs from "fs";
import { glob } from "glob";

import { Scanner, detectFramework } from "../../backend/src/scanner";
import { formatPretty, formatJSON } from "./formatter";
import {
  getGitRoot,
  getChangedFiles,
  getCommitFiles,
  resolveProjectFromGit,
} from "./git";

interface CliOpts {
  json?: boolean;
  changed?: boolean;
  commit?: string;
}

const program = new Command();

program
  .name("memory-leak-scan")
  .description("Scan Angular / React projects for common memory leak patterns")
  .version("1.0.0")
  .argument("[path]", "Absolute or relative path to the project root")
  .option("--json", "Output results as JSON instead of colored text")
  .option("--changed", "Scan only currently changed files in git")
  .option("--commit <id>", "Scan only files changed in a specific git commit")
  .action(async (targetArg?: string) => {
    const opts = program.opts<CliOpts>();

    try {
      let projectPath: string;
      let mode: ScanMode;

      if (opts.changed || opts.commit) {
        const cwd = targetArg ? path.resolve(targetArg) : process.cwd();
        const gitRoot = getGitRoot(cwd);
        projectPath = resolveProjectFromGit(gitRoot, targetArg);
        const framework = detectFramework(projectPath);

        const files = opts.commit
          ? getCommitFiles(gitRoot, opts.commit, framework)
          : getChangedFiles(gitRoot, framework);

        if (files.length === 0) {
          console.log(
            chalk.yellow("\n  No scannable files found in ") +
              (opts.commit
                ? chalk.bold(`commit ${opts.commit}`)
                : chalk.bold("current git changes")) +
              chalk.yellow(".\n")
          );
          process.exit(0);
        }

        if (!opts.json) {
          console.log(
            chalk.dim(`\n  ${files.length} file(s) to scan:\n`) +
              files.map((f) => chalk.dim(`    • ${f}`)).join("\n") +
              "\n"
          );
        }

        mode = { type: "partial", files: makeRelativeToProject(files, gitRoot, projectPath) };
      } else {
        projectPath = await resolveProjectPath(targetArg);
        mode = await promptScanMode(projectPath);
      }

      const scanner = new Scanner();
      const spinner = ora({ text: "Scanning for memory leaks…", spinner: "dots" }).start();

      const result =
        mode.type === "full"
          ? scanner.scan(projectPath)
          : scanner.scanFiles(projectPath, mode.files);

      spinner.stop();

      if (opts.json) {
        console.log(formatJSON(result));
      } else {
        console.log(formatPretty(result));
      }

      const hasHigh = result.issues.some((i) => i.severity === "HIGH");
      process.exit(hasHigh ? 1 : 0);
    } catch (err: any) {
      console.error(chalk.red.bold("\n  Error: ") + err.message + "\n");
      process.exit(2);
    }
  });

program.parse();

/**
 * Git paths are relative to the git root, but scanFiles expects paths
 * relative to the project root. Re-base when they differ.
 */
function makeRelativeToProject(
  files: string[],
  gitRoot: string,
  projectPath: string
): string[] {
  if (path.resolve(gitRoot) === path.resolve(projectPath)) return files;

  return files
    .map((f) => {
      const abs = path.resolve(gitRoot, f);
      const rel = path.relative(projectPath, abs);
      if (rel.startsWith("..")) return null;
      return rel;
    })
    .filter((f): f is string => f !== null);
}

async function resolveProjectPath(arg?: string): Promise<string> {
  if (arg) {
    const resolved = path.resolve(arg);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Path does not exist: ${resolved}`);
    }
    return resolved;
  }

  const { projectPath } = await inquirer.prompt<{ projectPath: string }>([
    {
      type: "input",
      name: "projectPath",
      message: "Enter the path to your project root:",
      validate: (input: string) => {
        const resolved = path.resolve(input);
        if (!fs.existsSync(resolved)) return `Path does not exist: ${resolved}`;
        return true;
      },
    },
  ]);

  return path.resolve(projectPath);
}

type ScanMode =
  | { type: "full" }
  | { type: "partial"; files: string[] };

async function promptScanMode(projectPath: string): Promise<ScanMode> {
  const isGitRepo = (() => {
    try {
      getGitRoot(projectPath);
      return true;
    } catch {
      return false;
    }
  })();

  const choices = [
    { name: "Entire project", value: "full" },
    { name: "Select specific files", value: "partial" },
  ];

  if (isGitRepo) {
    choices.push(
      { name: "Current git changes (modified / staged / untracked)", value: "git-changed" },
      { name: "Files from a git commit", value: "git-commit" },
    );
  }

  const { mode } = await inquirer.prompt<{ mode: string }>([
    {
      type: "list",
      name: "mode",
      message: "What would you like to scan?",
      choices,
    },
  ]);

  if (mode === "full") {
    return { type: "full" };
  }

  if (mode === "git-changed") {
    const gitRoot = getGitRoot(projectPath);
    const framework = detectFramework(projectPath);
    const files = getChangedFiles(gitRoot, framework);

    if (files.length === 0) {
      throw new Error("No scannable changed files found in git.");
    }

    console.log(
      chalk.dim(`\n  ${files.length} changed file(s):\n`) +
        files.map((f) => chalk.dim(`    • ${f}`)).join("\n") +
        "\n"
    );

    return { type: "partial", files: makeRelativeToProject(files, gitRoot, projectPath) };
  }

  if (mode === "git-commit") {
    const { commitId } = await inquirer.prompt<{ commitId: string }>([
      {
        type: "input",
        name: "commitId",
        message: "Enter the git commit ID (hash, tag, or ref):",
        validate: (input: string) => {
          if (!input.trim()) return "Commit ID is required.";
          return true;
        },
      },
    ]);

    const gitRoot = getGitRoot(projectPath);
    const framework = detectFramework(projectPath);
    const files = getCommitFiles(gitRoot, commitId.trim(), framework);

    if (files.length === 0) {
      throw new Error(`No scannable files found in commit ${commitId.trim()}.`);
    }

    console.log(
      chalk.dim(`\n  ${files.length} file(s) in commit ${commitId.trim()}:\n`) +
        files.map((f) => chalk.dim(`    • ${f}`)).join("\n") +
        "\n"
    );

    return { type: "partial", files: makeRelativeToProject(files, gitRoot, projectPath) };
  }

  // "partial" — manual file selection
  const framework = detectFramework(projectPath);
  const pattern =
    framework === "react" ? "**/*.{ts,tsx,jsx}" : "**/*.ts";

  const allFiles = await glob(pattern, {
    cwd: projectPath,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
  });

  if (allFiles.length === 0) {
    throw new Error("No matching source files found in the project.");
  }

  const { selectedFiles } = await inquirer.prompt<{ selectedFiles: string[] }>([
    {
      type: "checkbox",
      name: "selectedFiles",
      message: `Select files to scan (${allFiles.length} found):`,
      choices: allFiles.map((f) => ({ name: f, value: f })),
      pageSize: 20,
      validate: (answer: string[]) => {
        if (answer.length === 0) return "Select at least one file.";
        return true;
      },
    },
  ]);

  return { type: "partial", files: selectedFiles };
}
