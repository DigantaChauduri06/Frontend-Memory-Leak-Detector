import {
  SourceFile,
  SyntaxKind,
  PropertyAccessExpression,
} from "ts-morph";
import { Issue } from "../types";
import { Rule } from "./rule";
import {
  isAngularComponent,
  getNgOnDestroy,
  extractSnippet,
} from "./helpers";

export class EventListenerRule implements Rule {
  name = "event-listener";
  framework = "angular" as const;

  analyze(sourceFile: SourceFile, filePath: string, lines: string[]): Issue[] {
    const issues: Issue[] = [];

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of calls) {
      const expr = call.getExpression();
      if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) continue;

      const propAccess = expr as PropertyAccessExpression;
      if (propAccess.getName() !== "addEventListener") continue;

      const containingClass = call.getFirstAncestorByKind(
        SyntaxKind.ClassDeclaration
      );
      if (!containingClass || !isAngularComponent(containingClass)) continue;

      const ngOnDestroy = getNgOnDestroy(containingClass);
      const destroyBody = ngOnDestroy?.getBodyText() || "";

      if (!destroyBody.includes("removeEventListener")) {
        const args = call.getArguments();
        const eventName = args.length > 0 ? args[0].getText() : "unknown";

        issues.push({
          file: filePath,
          line: call.getStartLineNumber(),
          message: `addEventListener(${eventName}) without removeEventListener in ngOnDestroy — listener will persist after component is destroyed`,
          severity: "HIGH",
          category: "event-listener",
          snippet: extractSnippet(lines, call.getStartLineNumber()),
        });
      }
    }

    return issues;
  }
}
