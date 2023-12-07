import ts from 'typescript'

/**
 * Determines if the specified node is a 'module.exports = []' binary expression.
 * This verification also determines if the right hand expression
 * is an array.
 *
 * @param node The node to evaluate
 * @returns boolean if the node is a module.exports = []
 */

export function isModuleExportsArray(node: ts.Node): node is (ts.Node & {right: ts.ArrayLiteralExpression}) {
  return ts.isBinaryExpression(node) &&

    ts.isPropertyAccessExpression(node.left) &&
    ts.isIdentifier(node.left.name) &&
    node.left.name.escapedText === 'exports' &&
    ts.isArrayLiteralExpression(node.right) &&

    ts.isIdentifier(node.left.expression) &&
    node.left.expression.escapedText === 'module'
}

