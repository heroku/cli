import ts from 'typescript'

export type ItFunctionCall =  ts.CallExpression & {
  expression: ts.Identifier & {
    escapedText: 'it'
  }
  arguments: [ts.StringLiteral, ts.FunctionLikeDeclaration]
}

/**
 * Determines if the specified node matches it('str', func).
 *
 * @param node The node to evaluate
 * @returns boolean if the node matches
 */
export const isTestItCall =  (node: ts.Node): node is ItFunctionCall => (
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.escapedText === 'it' &&
  ts.isStringLiteral(node.arguments[0]) &&
  ts.isFunctionLike(node.arguments[1])
)

