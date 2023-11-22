import ts from 'typescript'
import {
  buildPropertyAccessExpressionChain,
  removeUtilPropertyAccessFromCallExpression,
  subWithUx, transformActionStart, transformExit,
} from './helpers.js'
import {isCallWith1PrecedingPropertyAccess} from './validators.js'

const transformCliUtils = (node: ts.Node, utilVarName: string, file: string): ts.Node => {
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

  const [propAccess] = propertyAccessChain
  // transform
  switch (propAccess) {
  case 'console': // todo: verify a reason to not use console.log/error
  case 'color':
    return removeUtilPropertyAccessFromCallExpression(node, utilVarName)
  default:
    console.error(`unhandled heroku-cli-util function call: ${propertyAccessChain.join('.')}\n${file}`)
    return node
    // throw new Error(`Unknown heroku-cli-util call: ${callName}`)
  }
}

export default transformCliUtils
