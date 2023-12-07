import ts from 'typescript'
import {
  buildPropertyAccessExpressionChain,
  removeUtilPropertyAccessFromCallExpression, setUtilVarName, showWarning,
  subWithUx, transformActionFuncs, transformColors, transformExit,
} from './helpers.js'
import {isCallWith1PrecedingPropertyAccess} from './validators.js'

const transformCliUtils = (node: ts.Node, utilVarName: string, file: string) => {
  setUtilVarName(utilVarName)
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
    return node
  }

  const propertyAccessChain = buildPropertyAccessExpressionChain(node.expression)

  if (propertyAccessChain.length === 0) {
    // was not heroku-cli-util call
    return node
  }

  const showWarningWFile = () => showWarning(propertyAccessChain, file)

  if (propertyAccessChain.length === 1 && isCallWith1PrecedingPropertyAccess(node)) {
    const [callName] = propertyAccessChain

    // transform
    switch (callName) {
    case 'warn':
    case 'log':
    case 'styledHeader':
    case 'styledObject':
    case 'styledJSON':
    case 'error': // ???
      return subWithUx(node)
    case 'exit':
      return transformExit(node)
    case 'command':
      // ignore. Handled by command object transform
      return node
    default:
      // remainder: open,prompt,linewrap, action.*, confirmApp, table
      showWarningWFile()
      return node
      // throw new Error(`Unknown heroku-cli-util call: ${callName}`)
    }
  }

  const [propAccess] = propertyAccessChain

  switch (propAccess) {
  case 'action':
    return transformActionFuncs(node, propertyAccessChain)
  case 'color':
    return transformColors({callEx: node, propertyAccessChain})
  case 'console': // todo: verify a reason to not use console.log/error
    return removeUtilPropertyAccessFromCallExpression({callEx: node, propertyAccessChain})
  default:
    showWarningWFile()
    // remainder: action.warn
    return node
  }
}

export default transformCliUtils
