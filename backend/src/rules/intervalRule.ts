import { SourceFile, SyntaxKind } from "ts-morph";
import { Issue } from "../types";
import { Rule } from "./rule";
import {
  isAngularComponent,
  getNgOnDestroy,
  extractSnippet,
} from "./helpers";

export class IntervalRule implements Rule {
  name = "interval";
  framework = "angular" as const;

  analyze(sourceFile: SourceFile, filePath: string, lines: string[]): Issue[] {
    const issues: Issue[] = [];

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of calls) {
      const exprText = call.getExpression().getText();
      const isInterval = exprText === "setInterval" || exprText === "window.setInterval";
      const isTimeout = exprText === "setTimeout" || exprText === "window.setTimeout";

      if (!isInterval && !isTimeout) continue;

      const containingClass = call.getFirstAncestorByKind(
        SyntaxKind.ClassDeclaration
      );
      if (!containingClass || !isAngularComponent(containingClass)) continue;

      const clearFn = isInterval ? "clearInterval" : "clearTimeout";
      const timerType = isInterval ? "setInterval" : "setTimeout";

      const ngOnDestroy = getNgOnDestroy(containingClass);
      const destroyBody = ngOnDestroy?.getBodyText() || "";

      if (!destroyBody.includes(clearFn)) {
        issues.push({
          file: filePath,
          line: call.getStartLineNumber(),
          message: `${timerType}() in component without ${clearFn}() in ngOnDestroy — timer will keep running after component is destroyed`,
          severity: "HIGH",
          category: "interval",
          snippet: extractSnippet(lines, call.getStartLineNumber()),
        });
      }
    }

    return issues;
  }
}
