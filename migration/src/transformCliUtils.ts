import ts from 'typescript'

const {isCallExpression} = ts

const transformCliUtils = (node: ts.Node, importName: string) => {
  const isUtilCall = isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.escapedText === 'cli'
  if (!isUtilCall) {
    return node
  }

  // transform
}

export default transformCliUtils
