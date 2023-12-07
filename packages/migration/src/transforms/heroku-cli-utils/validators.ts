import ts from 'typescript'

type ExpressionTerminatesWithIdentifier = ts.PropertyAccessExpression & {
  expression: ts.Identifier
}

export type CallWith1PrecedingPropertyAccess = ts.CallExpression & {
  expression: ExpressionTerminatesWithIdentifier
}
export type CallWith2PrecedingPropertyAccess = ts.CallExpression & {
  expression: ts.PropertyAccessExpression & {
    expression: ExpressionTerminatesWithIdentifier
  }
}
export const isCallWith1PrecedingPropertyAccess = (node: ts.Node): node is CallWith1PrecedingPropertyAccess => (
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  ts.isIdentifier(node.expression.expression)
)
export const isCallWith2PrecedingPropertyAccess = (node: ts.Node): node is CallWith2PrecedingPropertyAccess => (
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  ts.isPropertyAccessExpression(node.expression.expression) &&
  ts.isIdentifier(node.expression.expression.expression)
)
