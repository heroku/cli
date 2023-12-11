import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'

const {factory} = ts

const replaceAccessInCallExpression = (callEx: ts.CallExpression, sub: ts.PropertyAccessExpression) => factory.updateCallExpression(
  callEx,
  sub,
  callEx.typeArguments,
  callEx.arguments,
)

const subColorAccessOneToOne = (callEx: ts.CallExpression, sub: string) => replaceAccessInCallExpression(
  callEx,
  factory.createPropertyAccessExpression(
    factory.createIdentifier('color'),
    factory.createIdentifier(sub),
  ),
)

const subNestedColorAccess = (callEx: ts.CallExpression, sub0: string, sub1: string) => replaceAccessInCallExpression(
  callEx,
  factory.createPropertyAccessExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier('color'),
      factory.createIdentifier(sub0),
    ),
    factory.createIdentifier(sub1),
  ),
)

// handle these https://github.com/heroku/heroku-cli-color/blob/main/src/color.ts#L12
export const MISSING_FUNC_REPLACEMENT_MAP = new Map([
  ['cmd', (callEx: ts.CallExpression) => subNestedColorAccess(callEx, 'cyan', 'bold')],
  ['attachment', (callEx: ts.CallExpression) => subColorAccessOneToOne(callEx, 'cyan')],
  ['addon', (callEx: ts.CallExpression) => subColorAccessOneToOne(callEx, 'yellow')],
  ['configVar', (callEx: ts.CallExpression) => subColorAccessOneToOne(callEx, 'green')],
  ['release', (callEx: ts.CallExpression) => subNestedColorAccess(callEx, 'blue', 'bold')],
  ['pipeline', (callEx: ts.CallExpression) => subNestedColorAccess(callEx, 'green', 'bold')],
  ['app', (callEx: ts.CallExpression) => subColorAccessOneToOne(callEx, 'magenta')],
  ['heroku', (callEx: ts.CallExpression) => subColorAccessOneToOne(callEx, 'magenta')],
])

export const subWithUx = (callEx: ts.CallExpression, utilVarName: string) => {
  const visitor = (node: ts.Node): ts.Node => {
    if (!ts.isPropertyAccessExpression(node)) {
      return node
    }

    if (ts.isIdentifier(node.expression) && node.expression.escapedText.toString() === utilVarName) {
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

type SharedArgs = {
  callEx: ts.CallExpression,
  replaceName?: string,
  propertyAccessChain: string[]
  showWarning: () => void
  utilVarName: string
}

// cli.color.*(...args) => color.*(...args)
export const removeCliPropertyAccessFromCallExpression = (args: SharedArgs) => {
  const {callEx, showWarning,  utilVarName} = args
  let found = false

  const visitor = (node: ts.Node): ts.Node => {
    if (!ts.isPropertyAccessExpression(node)) {
      return node
    }

    if (ts.isIdentifier(node.expression) && node.expression.escapedText.toString() === utilVarName) {
      found = true
      return node.name
    }

    return ts.visitEachChild(node, visitor, nullTransformationContext)
  }

  const result =  ts.visitEachChild(callEx, visitor, nullTransformationContext)

  if (!found) {
    showWarning()
  }

  return result
}

export const transformColors = (args: SharedArgs) => {
  const {propertyAccessChain, callEx} = args
  const [, cliAccess] = propertyAccessChain
  const specialReplace = MISSING_FUNC_REPLACEMENT_MAP.get(cliAccess)
  if (specialReplace) {
    return specialReplace(callEx)
  }

  return removeCliPropertyAccessFromCallExpression(args)
}

export const transformActionFuncs = (args: SharedArgs) => {
  const {callEx, propertyAccessChain, utilVarName, showWarning} = args
  const [, secondPropAccess] = propertyAccessChain
  if (propertyAccessChain.length === 2) {
    switch (secondPropAccess) {
    case 'status':
    case 'start':
    case 'done':
      return subWithUx(callEx, utilVarName)
    default:
      showWarning()
      return callEx
    }
  }

  showWarning()

  return callEx
}

export const transformExit = (callEx: ts.CallExpression, utilVarName: string) => {
  // * cli.exit(code, message?)
  //   * if message
  //       * ux.error(message, {exit: code})
  //   * without message
  //       * ux.exit(code)
  if (callEx.arguments.length === 1) {
    return subWithUx(callEx, utilVarName)
  }

  return factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier('ux'),
      factory.createIdentifier('error'),
    ),
    callEx.typeArguments,
    [
      callEx.arguments[1], // move msg from second to first arg
      factory.createObjectLiteralExpression(
        [factory.createPropertyAssignment(
          factory.createIdentifier('exit'),
          callEx.arguments[0], // reuse exit code
        )],
        false,
      ),
    ],
  )
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

