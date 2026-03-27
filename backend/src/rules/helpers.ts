import {
  ClassDeclaration,
  MethodDeclaration,
  CallExpression,
  SyntaxKind,
  PropertyAccessExpression,
} from "ts-morph";

export function isAngularComponent(classDecl: ClassDeclaration): boolean {
  return classDecl.getDecorators().some((d) => d.getName() === "Component");
}

export function getNgOnDestroy(
  classDecl: ClassDeclaration
): MethodDeclaration | undefined {
  return classDecl
    .getInstanceMethods()
    .find((m) => m.getName() === "ngOnDestroy");
}

export function ngOnDestroyContains(
  classDecl: ClassDeclaration,
  text: string
): boolean {
  const method = getNgOnDestroy(classDecl);
  if (!method) return false;
  return (method.getBodyText() || "").includes(text);
}

export function hasTakeUntilInPipe(subscribeCall: CallExpression): boolean {
  const expr = subscribeCall.getExpression();
  if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) return false;

  const propAccess = expr as PropertyAccessExpression;
  const receiver = propAccess.getExpression();

  if (receiver.getKind() === SyntaxKind.CallExpression) {
    const receiverCall = receiver as CallExpression;
    const receiverExpr = receiverCall.getExpression();

    if (receiverExpr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const receiverPropAccess = receiverExpr as PropertyAccessExpression;
      if (receiverPropAccess.getName() === "pipe") {
        const pipeArgs = receiverCall.getArguments();
        return pipeArgs.some((arg) => {
          const text = arg.getText();
          return text.startsWith("takeUntil") || text.startsWith("take(");
        });
      }
    }
  }

  return false;
}

export function extractSnippet(lines: string[], lineNumber: number): string[] {
  const start = Math.max(0, lineNumber - 4);
  const end = Math.min(lines.length, lineNumber + 3);
  return lines.slice(start, end).map((line, i) => {
    const num = start + i + 1;
    const marker = num === lineNumber ? ">" : " ";
    return `${marker} ${num.toString().padStart(4)} | ${line}`;
  });
}
