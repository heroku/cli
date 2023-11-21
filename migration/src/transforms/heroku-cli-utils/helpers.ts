import ts from 'typescript'

const {factory} = ts

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

// // attempt to traverse upwards from "cli", but parents undefined
// const isReferenceToUtils = (node: ts.Node, utilVarName: string) => {
//   if (node.parent) {
//     debugger
//   }
//
//   const maybe = ts.isIdentifier(node) &&
//     node.escapedText.toString() === utilVarName &&
//     Boolean(node.parent)
//
//   return maybe
// }

export const subWithUx = (callEx: CallWith1PrecedingPropertyAccess) => factory.updateCallExpression(
  callEx,
  factory.updatePropertyAccessExpression(
    callEx.expression,
    factory.createIdentifier('ux'),
    callEx.expression.name,
  ),
  callEx.typeArguments,
  callEx.arguments,
)

// handle color calls using a separately imported package
// cli.color.red('str') => color.red('str')
export const changeColorCall = (callEx: CallWith2PrecedingPropertyAccess) => factory.createCallExpression(
  factory.createPropertyAccessExpression(
    factory.createIdentifier('color'),
    factory.createIdentifier(callEx.expression.name.escapedText.toString()),
  ),
  undefined,
  callEx.arguments,
)

export const transformActionStart = (callEx: CallWith1PrecedingPropertyAccess) => {
  // stub
  return callEx
}

// returns true for nodes patterns of `utilVarName.*(...args)`
// example `cli.warn(msg)`
const isUtilCall = (node: ts.Node, utilVarName: string): node is CallWith1PrecedingPropertyAccess => (
  isCallWith1PrecedingPropertyAccess(node) &&
  node.expression.expression.escapedText.toString() === utilVarName
)
export const buildPropertyAccessExpressionChain = (node: ts.PropertyAccessExpression, utilVarName: string) => {
  const propertyAccess = []

  let workingNode: ts.Node = node
  while (ts.isPropertyAccessExpression(workingNode)) {
    propertyAccess.push(workingNode.name.escapedText.toString())

    workingNode = workingNode.expression
  }

  if (ts.isIdentifier(workingNode) && workingNode.escapedText.toString() === utilVarName) {
    return propertyAccess.reverse()
  }

  return []
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
