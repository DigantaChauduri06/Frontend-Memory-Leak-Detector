import { SourceFile, SyntaxKind } from "ts-morph";
import { Issue } from "../types";
import { Rule } from "./rule";
import { extractSnippet } from "./helpers";
import {
  isUseEffectCall,
  getEffectCallback,
  effectBodyContainsPropertyCall,
  cleanupContains,
} from "./reactHelpers";

export class ReactSubscriptionRule implements Rule {
  name = "react-subscription";
  framework = "react" as const;

  analyze(sourceFile: SourceFile, filePath: string, lines: string[]): Issue[] {
    const issues: Issue[] = [];

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of calls) {
      if (!isUseEffectCall(call)) continue;
      const callback = getEffectCallback(call);
      if (!callback) continue;

      if (
        effectBodyContainsPropertyCall(callback, "subscribe") &&
        !cleanupContains(callback, "unsubscribe")
      ) {
        issues.push({
          file: filePath,
          line: call.getStartLineNumber(),
          message:
            ".subscribe() in useEffect without .unsubscribe() in cleanup — subscription will leak after unmount",
          severity: "HIGH",
          category: "subscription",
          snippet: extractSnippet(lines, call.getStartLineNumber()),
        });
      }
    }

    return issues;
  }
}
