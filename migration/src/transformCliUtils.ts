import ts, {isCallExpression} from 'typescript'

const transformCliUtils = (node: ts.Node) => {
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
