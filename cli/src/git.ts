import { execSync } from "child_process";
import * as path from "path";
import { Framework } from "../../backend/src/types";

function run(cmd: string, cwd: string): string {
  return execSync(cmd, { cwd, encoding: "utf-8", timeout: 15000 }).trim();
}

const FRAMEWORK_EXTENSIONS: Record<Framework, RegExp> = {
  angular: /\.ts$/,
  react: /\.(ts|tsx|jsx)$/,
};

const IGNORED_DIRS = /(?:^|\/)(?:node_modules|dist|build|\.next)\//;

function filterByFramework(files: string[], framework: Framework): string[] {
  const ext = FRAMEWORK_EXTENSIONS[framework];
  return files.filter((f) => ext.test(f) && !IGNORED_DIRS.test(f));
}

function dedupe(files: string[]): string[] {
  return [...new Set(files)];
}

function splitLines(output: string): string[] {
  if (!output) return [];
  return output.split("\n").filter(Boolean);
}

export function getGitRoot(cwd: string): string {
  try {
    return run("git rev-parse --show-toplevel", cwd);
  } catch {
    throw new Error(
      "Not a git repository. --changed and --commit require a git repo."
    );
  }
}

/**
 * Returns files that are currently modified, staged, or untracked
 * (relative to the repo root).
 */
export function getChangedFiles(
  repoRoot: string,
  framework: Framework
): string[] {
  const unstaged = splitLines(run("git diff --name-only", repoRoot));
  const staged = splitLines(run("git diff --name-only --cached", repoRoot));
  const untracked = splitLines(
    run("git ls-files --others --exclude-standard", repoRoot)
  );

  const all = dedupe([...unstaged, ...staged, ...untracked]);
  return filterByFramework(all, framework);
}

/**
 * Returns files changed in a specific commit
 * (relative to the repo root).
 * Uses diff-tree which handles root commits gracefully.
 */
export function getCommitFiles(
  repoRoot: string,
  commitId: string,
  framework: Framework
): string[] {
  try {
    const output = run(
      `git diff-tree --no-commit-id --name-only -r ${commitId}`,
      repoRoot
    );
    const files = splitLines(output);
    return filterByFramework(files, framework);
  } catch {
    throw new Error(
      `Could not read commit "${commitId}". Make sure the commit ID is valid.`
    );
  }
}

/**
 * Resolve the project root from the git root.
 * If the user supplied a project path, use it; otherwise fall back to git root.
 */
export function resolveProjectFromGit(
  gitRoot: string,
  projectPath?: string
): string {
  return projectPath ? path.resolve(projectPath) : gitRoot;
}
