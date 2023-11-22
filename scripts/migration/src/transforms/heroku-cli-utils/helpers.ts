import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {CallWith1PrecedingPropertyAccess} from './validators.js'

const {factory} = ts

// some nested PropertyAccessExpression need to be replaced, doing so here.
export const MISSING_FUNC_REPLACEMENT_MAP = new Map([
  ['cmd',  ['cyan', 'bold']],
])

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
// cli.color.red.bold('str') => color.red.bold('str')
export const removeUtilPropertyAccessFromCallExpression = (callEx: ts.CallExpression,  utilVarName: string) => {
  const visitor = (node: ts.Node) => {
    if (!ts.isPropertyAccessExpression(node)) {
      return node
    }

    const additionalTransform = MISSING_FUNC_REPLACEMENT_MAP.get(node.name.text)
    if (additionalTransform) {
      // redefine node with update
      debugger
    }

    if (ts.isIdentifier(node.expression) && node.expression.escapedText.toString() === utilVarName) {
      return node.name
    }

    return ts.visitEachChild(node, visitor, nullTransformationContext)
  }

  return ts.visitEachChild(callEx, visitor, nullTransformationContext)
}

export const transformActionStart = (callEx: CallWith1PrecedingPropertyAccess) => {
  // stub
  return callEx
}

export const transformExit = (callEx: CallWith1PrecedingPropertyAccess) => {
  // stub
  return callEx
}

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

