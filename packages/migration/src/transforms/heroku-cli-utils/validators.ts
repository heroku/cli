import ts from 'typescript'

type ExpressionTerminatesWithIdentifier = ts.PropertyAccessExpression & {
  expression: ts.Identifier
}

export type CallWith1PrecedingPropertyAccess = ts.CallExpression & {
  expression: ExpressionTerminatesWithIdentifier
}

/**
 * Determines if the specified node has this shape:
 * aObj.aFunc(*)
 * example: cli.warn('a msg')
 * fails on more than 1 chaining: cli.color.blue('a msg')
 * @param node The node to evaluate
 * @returns boolean if the node matches pattern
 */
export const isCallWith1PrecedingPropertyAccess = (node: ts.Node): node is CallWith1PrecedingPropertyAccess => (
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  ts.isIdentifier(node.expression.expression)
)

