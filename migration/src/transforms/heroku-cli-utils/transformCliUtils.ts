import ts from 'typescript'
import {
  buildPropertyAccessExpressionChain,
  buildCallExpressionWithNestedPropertyAccess,
  isCallWith1PrecedingPropertyAccess, isCallWith2PrecedingPropertyAccess,
  subWithUx, transformActionStart,
} from './helpers.js'

const transformCliUtils = (node: ts.Node, utilVarName: string) => {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
    return node
  }

  const propertyAccessChain = buildPropertyAccessExpressionChain(node.expression, utilVarName)

  if (propertyAccessChain.length === 0) {
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
    case 'command':
      // ignore. Handled elsewhere
      return node
    default:
      return node
      // throw new Error(`Unknown heroku-cli-util call: ${callName}`)
    }
  }

  if (propertyAccessChain.length === 2 && isCallWith2PrecedingPropertyAccess(node)) {
    const [propAccess, ...rest] = propertyAccessChain
    // transform
    switch (propAccess) {
    case 'color':
      return buildCallExpressionWithNestedPropertyAccess(node, propertyAccessChain)
    default:
      return node
      // throw new Error(`Unknown heroku-cli-util call: ${callName}`)
    }
  }
}

export default transformCliUtils
