import ts from 'typescript'
import {subWithUx, UtilCall} from './helpers.js'

const {isCallExpression} = ts

// returns true for nodes patterns of `utilVarName.*(...args)
// example `cli.warn(msg)`
const isUtilCall = (node: ts.Node, utilVarName: string): node is UtilCall =>  (
  isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  ts.isIdentifier(node.expression.expression) &&
  node.expression.expression.escapedText.toString() === utilVarName
)

const transformCliUtils = (node: ts.Node, utilVarName: string) => {
  if (!isUtilCall(node, utilVarName)) {
    return node
  }

  const callName = node.expression.name.escapedText.toString()

  // transform
  switch (callName) {
  case 'warn':
  case 'log':
    return subWithUx(node)
  default:
    return node
    // throw new Error(`Unknown heroku-cli-util call: ${callName}`)
  }
}

export default transformCliUtils
