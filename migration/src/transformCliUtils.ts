import ts from 'typescript'

const {isCallExpression} = ts

const transformCliUtils = (node: ts.Node, importName: string) => {
  const isUtilCall = isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.escapedText.toString() === importName

  if (!isUtilCall) {
    return node
  }

  const callName = node.expression.name.escapedText.toString()

  // transform
  debugger
}

export default transformCliUtils
