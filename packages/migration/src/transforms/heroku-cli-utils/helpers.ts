import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'

const {factory} = ts

// please forgive me for this
let utilVarName = 'cli'
export const setUtilVarName = (newName: string) => {
  utilVarName = newName
}

export const getUtilVarName = () => utilVarName

export const showWarning = (propertyAccessChain: string[], file?: string) => {
  console.error(`unhandled heroku-cli-util function call: ${propertyAccessChain.join('.')}${file ? '\n' + file : ''}`)
}

// some nested PropertyAccessExpression need to be replaced, doing so here.
export const MISSING_MISING_FUNC_REPLACEMENT_MAP = new Map([
  ['cmd',  ['cyan', 'bold']],
])

export const subWithUx = (callEx: ts.CallExpression) => {
  const visitor = (node: ts.Node): ts.Node => {
    if (!ts.isPropertyAccessExpression(node)) {
      return node
    }

    if (ts.isIdentifier(node.expression) && node.expression.escapedText.toString() === getUtilVarName()) {
      return factory.updatePropertyAccessExpression(
        node,
        factory.createIdentifier('ux'),
        node.name,
      )
    }

    return ts.visitEachChild(node, visitor, nullTransformationContext)
  }

  return ts.visitEachChild(callEx, visitor, nullTransformationContext)
}

type RemoveUtilPropertyAccessFromCallExpressionArgs = {
  callEx: ts.CallExpression,
  replaceName?: string,
  additionalTransforms?: Map<string, string[]>
  propertyAccessChain: string[]
}

export const removeUtilPropertyAccessFromCallExpression = (args: RemoveUtilPropertyAccessFromCallExpressionArgs) => {
  const {callEx, propertyAccessChain,  replaceName, additionalTransforms} = args
  let found = false
  const visitor = (node: ts.Node): ts.Node => {
    if (!ts.isPropertyAccessExpression(node)) {
      return node
    }

    if (additionalTransforms) {
      const additionalTransform = additionalTransforms.get(node.name.text)
      if (additionalTransform) {
        // redefine node with update
        showWarning(propertyAccessChain)
      }
    }

    if (ts.isIdentifier(node.expression) && node.expression.escapedText.toString() === getUtilVarName()) {
      found = true
      return node.name
    }

    return ts.visitEachChild(node, visitor, nullTransformationContext)
  }

  const result =  ts.visitEachChild(callEx, visitor, nullTransformationContext)

  if (!found) {
    showWarning(propertyAccessChain)
  }

  return result
}

export const transformColors = (args: RemoveUtilPropertyAccessFromCallExpressionArgs) => removeUtilPropertyAccessFromCallExpression({
  ...args, additionalTransforms: MISSING_MISING_FUNC_REPLACEMENT_MAP,
})

export const transformActionFuncs = (callEx: ts.CallExpression, propertyAccessChain: string[]) => {
  const [, secondPropAccess] = propertyAccessChain
  if (propertyAccessChain.length === 2) {
    switch (secondPropAccess) {
    case 'status':
    case 'start':
    case 'done':
      return subWithUx(callEx)
    default:
      showWarning(propertyAccessChain)
      return callEx
    }
  }

  showWarning(propertyAccessChain)

  // stub
  return callEx
}

export const transformExit = (callEx: ts.CallExpression) => {
  // stub
  return callEx
}

export const buildPropertyAccessExpressionChain = (node: ts.PropertyAccessExpression) => {
  const propertyAccess = []

  let workingNode: ts.Node = node
  while (ts.isPropertyAccessExpression(workingNode)) {
    propertyAccess.push(workingNode.name.escapedText.toString())

    workingNode = workingNode.expression
  }

  if (ts.isIdentifier(workingNode) && workingNode.escapedText.toString() === getUtilVarName()) {
    return propertyAccess.reverse()
  }

  return []
}

