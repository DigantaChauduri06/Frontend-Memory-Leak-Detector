import { SourceFile, SyntaxKind } from "ts-morph";
import { Issue } from "../types";
import { Rule } from "./rule";
import { extractSnippet } from "./helpers";
import {
  isUseEffectCall,
  getEffectCallback,
  effectBodyContainsCall,
  cleanupContains,
} from "./reactHelpers";

export class ReactIntervalRule implements Rule {
  name = "react-interval";
  framework = "react" as const;

  analyze(sourceFile: SourceFile, filePath: string, lines: string[]): Issue[] {
    const issues: Issue[] = [];

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of calls) {
      if (!isUseEffectCall(call)) continue;
      const callback = getEffectCallback(call);
      if (!callback) continue;

      const hasInterval = effectBodyContainsCall(callback, "setInterval");
      const hasTimeout = effectBodyContainsCall(callback, "setTimeout");

      if (hasInterval && !cleanupContains(callback, "clearInterval")) {
        issues.push({
          file: filePath,
          line: call.getStartLineNumber(),
          message:
            "setInterval() in useEffect without clearInterval() in cleanup — timer will keep running after unmount",
          severity: "HIGH",
          category: "interval",
          snippet: extractSnippet(lines, call.getStartLineNumber()),
        });
      }

      if (hasTimeout && !cleanupContains(callback, "clearTimeout")) {
        issues.push({
          file: filePath,
          line: call.getStartLineNumber(),
          message:
            "setTimeout() in useEffect without clearTimeout() in cleanup — timer may fire after unmount",
          severity: "HIGH",
          category: "interval",
          snippet: extractSnippet(lines, call.getStartLineNumber()),
        });
      }
    }

    return issues;
  }
}
