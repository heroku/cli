import ts from 'typescript'
import {
  buildPropertyAccessExpressionChain,
  removeUtilPropertyAccessFromCallExpression, setUtilVarName,
  subWithUx, transformAction, transformActionFuncs, transformColors, transformExit, transformTable,
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

  const showWarning = () => {
    console.error(`unhandled heroku-cli-util function call: ${propertyAccessChain.join('.')}\n${file}`)
  }

  if (propertyAccessChain.length === 1 && isCallWith1PrecedingPropertyAccess(node)) {
    const [callName] = propertyAccessChain

    // transform
    switch (callName) {
    case 'warn':
    case 'log':
    case 'styledObject':
    case 'styledJSON':
      return subWithUx(node)
    case 'action':
      return transformAction(node)
    case 'exit':
      return transformExit(node)
    case 'confirmApp':
      // todo: this was reimplemented in packages/cli/src/lib/apps/confirm-app.ts.
      //  May be too hard to add the import
      return node
    case 'table':
      return transformTable(node)
    case 'command':
      // ignore. Handled elsewhere
      return node
    default:
      showWarning()
      return node
      // throw new Error(`Unknown heroku-cli-util call: ${callName}`)
    }
  }

  const [propAccess] = propertyAccessChain
  // transform
  switch (propAccess) {
  case 'action':
    return transformActionFuncs(node, propertyAccessChain)
  case 'color':
    return transformColors({callEx: node})
  case 'console': // todo: verify a reason to not use console.log/error
    return removeUtilPropertyAccessFromCallExpression({callEx: node})
  default:
    showWarning()
    return node
      // throw new Error(`Unknown heroku-cli-util call: ${callName}`)
  }
}

export default transformCliUtils
