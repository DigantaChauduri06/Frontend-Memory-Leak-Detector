import {
  CallExpression,
  SyntaxKind,
  Node,
  ArrowFunction,
  FunctionExpression,
  ReturnStatement,
  Block,
  PropertyAccessExpression,
} from "ts-morph";

export function isUseEffectCall(call: CallExpression): boolean {
  const text = call.getExpression().getText();
  return text === "useEffect" || text === "React.useEffect";
}

export function getEffectCallback(
  call: CallExpression
): ArrowFunction | FunctionExpression | undefined {
  const args = call.getArguments();
  if (args.length === 0) return undefined;
  const first = args[0];
  if (Node.isArrowFunction(first)) return first;
  if (Node.isFunctionExpression(first)) return first;
  return undefined;
}

export function getCallbackBody(
  callback: ArrowFunction | FunctionExpression
): Block | undefined {
  const body = callback.getBody();
  if (Node.isBlock(body)) return body;
  return undefined;
}

/**
 * Checks whether the effect callback has a direct return statement
 * (cleanup function). Only checks top-level returns, not returns
 * inside nested functions.
 */
export function getCleanupReturn(
  callback: ArrowFunction | FunctionExpression
): ReturnStatement | undefined {
  const body = getCallbackBody(callback);
  if (!body) return undefined;

  for (const stmt of body.getStatements()) {
    if (Node.isReturnStatement(stmt) && stmt.getExpression()) {
      return stmt;
    }
  }

  return undefined;
}

export function hasCleanupReturn(
  callback: ArrowFunction | FunctionExpression
): boolean {
  return getCleanupReturn(callback) !== undefined;
}

export function cleanupContains(
  callback: ArrowFunction | FunctionExpression,
  text: string
): boolean {
  const ret = getCleanupReturn(callback);
  if (!ret) return false;
  const expr = ret.getExpression();
  if (!expr) return false;
  return expr.getText().includes(text);
}

export function effectBodyContainsCall(
  callback: ArrowFunction | FunctionExpression,
  fnName: string
): boolean {
  const body = getCallbackBody(callback);
  if (!body) return false;

  return body.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) => {
    const text = call.getExpression().getText();
    return text === fnName || text.endsWith(`.${fnName}`);
  });
}

export function effectBodyContainsPropertyCall(
  callback: ArrowFunction | FunctionExpression,
  methodName: string
): boolean {
  const body = getCallbackBody(callback);
  if (!body) return false;

  return body.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) => {
    const expr = call.getExpression();
    if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) return false;
    return (expr as PropertyAccessExpression).getName() === methodName;
  });
}
