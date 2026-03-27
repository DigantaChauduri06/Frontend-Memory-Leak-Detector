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

export class ReactEventListenerRule implements Rule {
  name = "react-event-listener";
  framework = "react" as const;

  analyze(sourceFile: SourceFile, filePath: string, lines: string[]): Issue[] {
    const issues: Issue[] = [];

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of calls) {
      if (!isUseEffectCall(call)) continue;
      const callback = getEffectCallback(call);
      if (!callback) continue;

      if (
        effectBodyContainsCall(callback, "addEventListener") &&
        !cleanupContains(callback, "removeEventListener")
      ) {
        issues.push({
          file: filePath,
          line: call.getStartLineNumber(),
          message:
            "addEventListener() in useEffect without removeEventListener in cleanup — listener will persist after unmount",
          severity: "HIGH",
          category: "event-listener",
          snippet: extractSnippet(lines, call.getStartLineNumber()),
        });
      }
    }

    return issues;
  }
}
