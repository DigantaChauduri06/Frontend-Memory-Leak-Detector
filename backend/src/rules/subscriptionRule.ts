import {
  SourceFile,
  SyntaxKind,
  CallExpression,
  PropertyAccessExpression,
} from "ts-morph";
import { Issue } from "../types";
import { Rule } from "./rule";
import {
  isAngularComponent,
  hasTakeUntilInPipe,
  ngOnDestroyContains,
  extractSnippet,
} from "./helpers";

export class SubscriptionRule implements Rule {
  name = "subscription";
  framework = "angular" as const;

  analyze(sourceFile: SourceFile, filePath: string, lines: string[]): Issue[] {
    const issues: Issue[] = [];

    const subscribeCalls = sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((call) => {
        const expr = call.getExpression();
        if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
          return (expr as PropertyAccessExpression).getName() === "subscribe";
        }
        return false;
      });

    for (const call of subscribeCalls) {
      const lineNumber = call.getStartLineNumber();
      const containingClass = call.getFirstAncestorByKind(
        SyntaxKind.ClassDeclaration
      );

      if (containingClass && isAngularComponent(containingClass)) {
        if (
          !hasTakeUntilInPipe(call) &&
          !ngOnDestroyContains(containingClass, "unsubscribe") &&
          !ngOnDestroyContains(containingClass, ".next()") &&
          !ngOnDestroyContains(containingClass, ".complete()")
        ) {
          issues.push({
            file: filePath,
            line: lineNumber,
            message:
              "Unmanaged subscription in Angular component — missing takeUntil or unsubscribe in ngOnDestroy",
            severity: "HIGH",
            category: "subscription",
            snippet: extractSnippet(lines, lineNumber),
          });
        }
      } else {
        if (!hasTakeUntilInPipe(call)) {
          issues.push({
            file: filePath,
            line: lineNumber,
            message:
              "Subscription without takeUntil — may cause memory leaks",
            severity: "MEDIUM",
            category: "subscription",
            snippet: extractSnippet(lines, lineNumber),
          });
        }
      }

      if (this.hasEmptyOrMissingErrorHandler(call)) {
        issues.push({
          file: filePath,
          line: lineNumber,
          message: "Subscription with empty or missing error handler",
          severity: "LOW",
          category: "subscription",
          snippet: extractSnippet(lines, lineNumber),
        });
      }
    }

    return issues;
  }

  private hasEmptyOrMissingErrorHandler(
    subscribeCall: CallExpression
  ): boolean {
    const args = subscribeCall.getArguments();

    if (args.length === 0) return true;

    if (args.length === 1) {
      const firstArg = args[0];
      if (firstArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
        return !firstArg.getText().includes("error");
      }
      return true;
    }

    if (args.length >= 2) {
      const errorText = args[1].getText().replace(/\s/g, "");
      const emptyPatterns = [
        "()",
        "()=>{}",
        "function(){}",
        "(_)=>{}",
        "(err)=>{}",
        "(error)=>{}",
      ];
      return emptyPatterns.includes(errorText);
    }

    return false;
  }
}
