import ts from 'typescript'

const {factory} = ts

export type UtilCall = ts.CallExpression & {
  expression: ts.PropertyAccessExpression & {
    expression: ts.Identifier
  }
}

export const subWithUx = (callEx: UtilCall) => factory.updateCallExpression(
  callEx,
  factory.updatePropertyAccessExpression(
    callEx.expression,
    factory.createIdentifier('ux'),
    callEx.expression.name,
  ),
  callEx.typeArguments,
  callEx.arguments,
)
