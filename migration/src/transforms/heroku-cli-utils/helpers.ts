import ts from 'typescript'

const {factory} = ts

export type UtilCall = ts.CallExpression & {
  expression: ts.PropertyAccessExpression & {
    expression: ts.Identifier
  }
}

export const subWithUx = (callEx: UtilCall) => {
  const propertyAccEx = callEx.expression
  return factory.updateCallExpression(
    callEx,
    factory.updatePropertyAccessExpression(
      propertyAccEx,
      propertyAccEx.expression,
      factory.createIdentifier('ux'),
    ),
    callEx.typeArguments,
    callEx.arguments,
  )
}
