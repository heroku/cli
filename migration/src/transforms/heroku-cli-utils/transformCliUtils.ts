import ts from 'typescript'
import {
  buildPropertyAccessExpressionChain,
  removeUtilPropertyAccessFromCallExpression,
  isCallWith1PrecedingPropertyAccess,
  subWithUx, transformActionStart, transformExit,
} from './helpers.js'

const transformCliUtils = (node: ts.Node, utilVarName: string) => {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
    return node
  }

  const propertyAccessChain = buildPropertyAccessExpressionChain(node.expression, utilVarName)

  if (propertyAccessChain.length === 0) {
    // was not heroku-cli-util call
    return node
  }

  if (propertyAccessChain.length === 1 && isCallWith1PrecedingPropertyAccess(node)) {
    const [callName] = propertyAccessChain

    // transform
    switch (callName) {
    case 'warn':
    case 'log':
    case 'styledObject':
      return subWithUx(node)
    case 'action':
      return transformActionStart(node)
    case 'exit':
      return transformExit(node)
    case 'command':
      // ignore. Handled elsewhere
      return node
    default:
      return node
      // throw new Error(`Unknown heroku-cli-util call: ${callName}`)
    }
  }

  if (propertyAccessChain.length === 2) {
    const [propAccess] = propertyAccessChain
    // transform
    switch (propAccess) {
    case 'console': // todo: verify a reason to not use console.log/error
    case 'color':
      return removeUtilPropertyAccessFromCallExpression(node, utilVarName)
    default:
      return node
      // throw new Error(`Unknown heroku-cli-util call: ${callName}`)
    }
  }
}

export default transformCliUtils
