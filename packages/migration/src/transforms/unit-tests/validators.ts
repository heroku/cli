import ts from 'typescript'

export type TestFunctionCall<Text extends string> = ts.CallExpression & {
  expression: ts.Identifier & {
    escapedText: Text
  }
  arguments: [ts.StringLiteral, ts.FunctionLikeDeclaration & {body: ts.Block}]
}

export type BeforeEachCall = ts.ExpressionStatement & {
  expression: ts.CallExpression & {
    expression: ts.Identifier & {
      escapedText: 'beforeEach'
    }
    arguments: [ts.FunctionLikeDeclaration & {body: ts.Block}]
  }
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
  node.expression.escapedText === 'it' &&
  ts.isStringLiteral(node.arguments[0]) &&
  ts.isFunctionLike(node.arguments[1]) &&
  ts.isBlock(node.arguments[1].body)
)

export const isTestDescribeCall = (node: ts.Node): node is TestFunctionCall<'describe'> => (
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.escapedText === 'describe' &&
  ts.isStringLiteral(node.arguments[0]) &&
  ts.isFunctionLike(node.arguments[1]) &&
  ts.isBlock(node.arguments[1].body)
)

export const isBeforeEachBlock = (node: ts.Node): node is BeforeEachCall => (
  ts.isExpressionStatement(node) &&
  ts.isCallExpression(node.expression) &&
  ts.isIdentifier(node.expression.expression) &&
  node.expression.expression.escapedText === 'beforeEach' &&
  ts.isFunctionLike(node.expression.arguments[0]) &&
  ts.isBlock(node.expression.arguments[0].body)
)
type NockVariableStatement = ts.VariableStatement & {
  declarationList: ts.VariableDeclarationList & {
    declarations: [
        ts.VariableDeclaration & { name: ts.Identifier },
      ts.Node,
    ]
  }
}
export const isNockVariableStatement = (node: ts.Node, varName: string): node is NockVariableStatement => (
  ts.isVariableStatement(node) &&
  ts.isCallExpression(node.declarationList.declarations[0]) &&
  isNockChainedCall(node.declarationList.declarations[0], varName)
)
// output an array of CallExpression/PropertyAccessExpression pairs? Just replace the "last" `nock(`?
/* finds patterns like this:
* let api = nock('https://api.heroku.com:443')
      .post('/spaces', postBody)
      .reply(201, responseBody)
*  */
export const isNockChainedCall = (node: ts.CallExpression, varName: string) => {
  let workingNode: ts.Node = node
  /* nodes are "upside down" compared to human reading. Given:
  * let api = nock('https://api.heroku.com:443')
    .post('/account/keys', {public_key: key})
    .reply(200)
  * node starts as `.reply(200)`, and last CallExpression/PropertyAccessExpression pair is our target `nock('https://api.heroku.com:443')`
  * */
  while (ts.isCallExpression(workingNode) && ts.isPropertyAccessExpression(workingNode.expression)) {
    workingNode = workingNode.expression.expression
  }

  return (ts.isIdentifier(workingNode) && workingNode.escapedText === varName) ||
    (ts.isCallExpression(workingNode) && ts.isIdentifier(workingNode.expression) && workingNode.expression.escapedText === varName)
}

