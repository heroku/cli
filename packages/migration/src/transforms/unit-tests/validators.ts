import ts from 'typescript'

export type TestFunctionCall<Text extends string> = ts.CallExpression & {
  expression: ts.Identifier & {
    escapedText: Text
  }
  arguments: [ts.StringLiteral, ts.FunctionExpression | ts.ArrowFunction]
}

/**
 * Determines if the specified node matches it('str', func).
 *
 * @param node The node to evaluate
 * @returns boolean if the node matches
 */
export const isTestItCall =  (node: ts.Node): node is TestFunctionCall<'it'> => (
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.escapedText === 'describe' &&
  ts.isStringLiteral(node.arguments[0]) &&
  ts.isFunctionLike(node.arguments[1])
)

export const isTestDescribeCall = (node: ts.Node): node is TestFunctionCall<'describe'> => (
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.escapedText === 'describe' &&
  ts.isStringLiteral(node.arguments[0]) &&
  (ts.isFunction(node.arguments[1]))
)
