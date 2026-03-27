import { SourceFile, SyntaxKind } from "ts-morph";
import { Issue } from "../types";
import { Rule } from "./rule";
import { extractSnippet } from "./helpers";
import {
  isUseEffectCall,
  getEffectCallback,
  hasCleanupReturn,
  getCallbackBody,
} from "./reactHelpers";

const SIDE_EFFECT_INDICATORS = [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "IntersectionObserver",
  "MutationObserver",
  "ResizeObserver",
  "requestAnimationFrame",
  ".on(",
  "connect(",
  "open(",
];

export class ReactEffectCleanupRule implements Rule {
  name = "react-effect-cleanup";
  framework = "react" as const;

  analyze(sourceFile: SourceFile, filePath: string, lines: string[]): Issue[] {
    const issues: Issue[] = [];

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of calls) {
      if (!isUseEffectCall(call)) continue;
      const callback = getEffectCallback(call);
      if (!callback) continue;

      if (hasCleanupReturn(callback)) continue;

      const body = getCallbackBody(callback);
      if (!body) continue;

      const bodyText = body.getText();
      const hasSideEffect = SIDE_EFFECT_INDICATORS.some((indicator) =>
        bodyText.includes(indicator)
      );

      if (hasSideEffect) {
        issues.push({
          file: filePath,
          line: call.getStartLineNumber(),
          message:
            "useEffect with side effects but no cleanup return — resources may leak after unmount",
          severity: "MEDIUM",
          category: "effect-cleanup",
          snippet: extractSnippet(lines, call.getStartLineNumber()),
        });
      }
    }

    return issues;
  }
}
