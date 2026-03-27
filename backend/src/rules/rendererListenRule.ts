import {
  SourceFile,
  SyntaxKind,
  PropertyAccessExpression,
  Node,
} from "ts-morph";
import { Issue } from "../types";
import { Rule } from "./rule";
import {
  isAngularComponent,
  getNgOnDestroy,
  extractSnippet,
} from "./helpers";

export class RendererListenRule implements Rule {
  name = "renderer-listen";
  framework = "angular" as const;

  analyze(sourceFile: SourceFile, filePath: string, lines: string[]): Issue[] {
    const issues: Issue[] = [];

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of calls) {
      const expr = call.getExpression();
      if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) continue;

      const propAccess = expr as PropertyAccessExpression;
      if (propAccess.getName() !== "listen") continue;

      const receiverText = propAccess.getExpression().getText();
      const isRenderer =
        receiverText.includes("renderer") || receiverText.includes("Renderer");
      if (!isRenderer) continue;

      const containingClass = call.getFirstAncestorByKind(
        SyntaxKind.ClassDeclaration
      );
      if (!containingClass || !isAngularComponent(containingClass)) continue;

      const parent = call.getParent();
      const isAssigned =
        parent &&
        (Node.isVariableDeclaration(parent) ||
          Node.isBinaryExpression(parent));

      if (!isAssigned) {
        issues.push({
          file: filePath,
          line: call.getStartLineNumber(),
          message:
            "Renderer2.listen() return value not captured — unlisten function is lost, listener will leak",
          severity: "MEDIUM",
          category: "renderer-listen",
          snippet: extractSnippet(lines, call.getStartLineNumber()),
        });
        continue;
      }

      const ngOnDestroy = getNgOnDestroy(containingClass);
      const destroyBody = ngOnDestroy?.getBodyText() || "";

      let varName = "";
      if (Node.isVariableDeclaration(parent)) {
        varName = parent.getName();
      } else if (Node.isBinaryExpression(parent)) {
        varName = parent.getLeft().getText();
      }

      if (varName && !destroyBody.includes(varName)) {
        issues.push({
          file: filePath,
          line: call.getStartLineNumber(),
          message: `Renderer2.listen() unlisten function (${varName}) not called in ngOnDestroy — listener will leak`,
          severity: "MEDIUM",
          category: "renderer-listen",
          snippet: extractSnippet(lines, call.getStartLineNumber()),
        });
      }
    }

    return issues;
  }
}
