import ts from 'typescript'

/**
 * Determines if the specified node matches it('str', func).
 *
 * @param node The node to evaluate
 * @returns boolean if the node matches
 */

export const isTestItCall =  (node: ts.Node): node is ts.CallExpression => ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.escapedText === 'it'
