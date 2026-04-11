import chalk from "chalk";
import { ScanResult, Issue, Severity } from "../../backend/src/types";

const severityColor: Record<Severity, (text: string) => string> = {
  HIGH: chalk.red.bold,
  MEDIUM: chalk.yellow.bold,
  LOW: chalk.blue,
};

const severityIcon: Record<Severity, string> = {
  HIGH: "✖",
  MEDIUM: "⚠",
  LOW: "ℹ",
};

function groupByFile(issues: Issue[]): Map<string, Issue[]> {
  const map = new Map<string, Issue[]>();
  for (const issue of issues) {
    const list = map.get(issue.file) || [];
    list.push(issue);
    map.set(issue.file, list);
  }
  return map;
}

export function formatPretty(result: ScanResult): string {
  const { framework, issues } = result;

  if (issues.length === 0) {
    return chalk.green.bold("\n  ✔ No memory leak issues found!\n");
  }

  const high = issues.filter((i) => i.severity === "HIGH").length;
  const medium = issues.filter((i) => i.severity === "MEDIUM").length;
  const low = issues.filter((i) => i.severity === "LOW").length;

  const lines: string[] = [];

  lines.push("");
  lines.push(
    chalk.bold(`  Memory Leak Scan Results`) +
      chalk.dim(` (${framework})`)
  );
  lines.push(chalk.dim("  " + "─".repeat(50)));
  lines.push(
    `  ${chalk.red.bold(high + " HIGH")}  ${chalk.yellow.bold(medium + " MEDIUM")}  ${chalk.blue(low + " LOW")}  ` +
      chalk.dim(`(${issues.length} total)`)
  );
  lines.push("");

  const grouped = groupByFile(issues);

  for (const [file, fileIssues] of grouped) {
    lines.push(chalk.underline.cyan(`  ${file}`));

    for (const issue of fileIssues) {
      const color = severityColor[issue.severity];
      const icon = severityIcon[issue.severity];
      const tag = color(`${icon} ${issue.severity.padEnd(6)}`);
      const loc = chalk.dim(`line ${issue.line}`);
      const cat = chalk.dim(`[${issue.category}]`);

      lines.push(`    ${tag} ${loc}  ${issue.message} ${cat}`);

      if (issue.snippet && issue.snippet.length > 0) {
        lines.push(chalk.dim("    ┌─────"));
        for (const snippetLine of issue.snippet) {
          lines.push(chalk.dim("    │ ") + chalk.gray(snippetLine));
        }
        lines.push(chalk.dim("    └─────"));
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

export function formatJSON(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}
