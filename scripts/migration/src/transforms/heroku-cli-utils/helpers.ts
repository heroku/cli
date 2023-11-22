import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {CallWith1PrecedingPropertyAccess, isCallWith1PrecedingPropertyAccess} from './validators.js'

const {factory} = ts

// some nested PropertyAccessExpression need to be replaced, doing so here.
export const MISSING_MISING_FUNC_REPLACEMENT_MAP = new Map([
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

type RemoveUtilPropertyAccessFromCallExpressionArgs = {
  callEx: ts.CallExpression,
  utilVarName: string,
  replaceName?: string,
  additionalTransforms?: Map<string, string[]>
}

export const removeUtilPropertyAccessFromCallExpression = (args: RemoveUtilPropertyAccessFromCallExpressionArgs) => {
  const {callEx, utilVarName, replaceName, additionalTransforms} = args
  const visitor = (node: ts.Node) => {
    if (!ts.isPropertyAccessExpression(node)) {
      return node
    }

    if (additionalTransforms) {
      const additionalTransform = additionalTransforms.get(node.name.text)
      if (additionalTransform) {
        // redefine node with update
      }
    }

    if (ts.isIdentifier(node.expression) && node.expression.escapedText.toString() === utilVarName) {
      return node.name
    }

    return ts.visitEachChild(node, visitor, nullTransformationContext)
  }

  return ts.visitEachChild(callEx, visitor, nullTransformationContext)
}

export const transformColors = (args: RemoveUtilPropertyAccessFromCallExpressionArgs) => removeUtilPropertyAccessFromCallExpression({
  ...args, additionalTransforms: MISSING_MISING_FUNC_REPLACEMENT_MAP,
})

export const transformAction = (callEx: CallWith1PrecedingPropertyAccess) => {
  // stub
  return callEx
}

export const transformActionFuncs = (callEx: ts.Node, propertyAccessChain: string[]) => {
  const [, firstPropAccess, secondPropAccess] = propertyAccessChain
  if (propertyAccessChain.length === 2) {
    switch (firstPropAccess) {
    case 'status':
    case 'start':
    case 'done':
      return subWithUx(callEx)
    default:
      console.error(`unhandled heroku-cli-util function call: ${propertyAccessChain.join('.')}`)
      return callEx
    }
  }

  console.error(`unhandled heroku-cli-util function call: ${propertyAccessChain.join('.')}`)

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

