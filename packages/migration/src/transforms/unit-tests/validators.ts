import ts from 'typescript'
import {getEndOfCallPropertyAccessChain} from './helpers.js'

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

export const isTestDescribeOrContextCall = (node: ts.Node): node is TestFunctionCall<'describe' | 'context'> => (
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  (node.expression.escapedText === 'describe' || node.expression.escapedText === 'context') &&
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
  const lastNode = getEndOfCallPropertyAccessChain(node)

  return (ts.isIdentifier(lastNode) && lastNode.escapedText === varName) ||
    (ts.isCallExpression(lastNode) && ts.isIdentifier(lastNode.expression) && lastNode.expression.escapedText === varName)
}

