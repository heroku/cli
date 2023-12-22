import ts from 'typescript'
import {getEndOfCallPropertyAccessChain} from './helpers.js'

// matches describe(), context(), it() calls
export type TestFunctionCall = ts.ExpressionStatement & {
  expression:  ts.CallExpression & {
    expression: ts.Identifier
    arguments: [ts.StringLiteral, ts.FunctionLikeDeclaration & {body: ts.Block}]
  }
}

export type BeforeEachCall = ts.ExpressionStatement & {
  expression: ts.CallExpression & {
    expression: ts.Identifier & {
      escapedText: 'beforeEach'
    }
    arguments: [ts.FunctionLikeDeclaration & {body: ts.Block}]
  }
}

type NockExpressionInstantiation = ts.ExpressionStatement & {
  expression: ts.BinaryExpression & {
    right: ts.CallExpression & {
      expression: ts.Identifier
      arguments: [ts.StringLiteral]
    }
    left: ts.Identifier
  }
}

/**
 * Determines if the specified node matches it('str', func).
 *
 * @param node The node to evaluate
 * @returns boolean if the node matches
 */
export const isTestItCall =  (node: ts.Node): node is TestFunctionCall => (
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.escapedText === 'it' &&
  ts.isStringLiteral(node.arguments[0]) &&
  ts.isFunctionLike(node.arguments[1]) &&
  ts.isBlock(node.arguments[1].body)
)

export const isTestDescribeOrContextCall = (node: ts.Node): node is TestFunctionCall => (
  ts.isExpressionStatement(node) &&
  ts.isCallExpression(node.expression) &&
  ts.isIdentifier(node.expression.expression) &&
  (node.expression.expression.escapedText === 'describe' || node.expression.expression.escapedText === 'context') &&
  ts.isStringLiteral(node.expression.arguments[0]) &&
  ts.isFunctionLike(node.expression.arguments[1]) &&
  ts.isBlock(node.expression.arguments[1].body)
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

/* finds patterns like this, regardless of depth of call chain:
* ANYTHING nock('https://api.heroku.com:443')
      .post('/spaces', postBody)
      .reply(201, responseBody)
*  */
export const isNockChainedCall = (node: ts.CallExpression, varName: string) => {
  const lastNode = getEndOfCallPropertyAccessChain(node)

  return (ts.isIdentifier(lastNode) && lastNode.escapedText === varName) ||
    (ts.isCallExpression(lastNode) && ts.isIdentifier(lastNode.expression) && lastNode.expression.escapedText === varName)
}

/* Finds patterns where `let api` is declared elsewhere like
* api = nock('https://api.heroku.com:443')
*  */
export const isNockExpressionStatementInstantiation = (statement: ts.Node): statement is NockExpressionInstantiation => (
  ts.isExpressionStatement(statement) &&
  ts.isBinaryExpression(statement.expression) &&
  ts.isCallExpression(statement.expression.right) &&
  ts.isIdentifier(statement.expression.right.expression) &&
  ts.isIdentifier(statement.expression.left) &&
  ts.isStringLiteral(statement.expression.right.arguments[0]) &&
  statement.expression.right.expression.escapedText === 'nock'
)

export type NockVariableDeclarationInstantiation = ts.VariableStatement & {
  declarationList: ts.VariableDeclarationList & {
    declarations: [{
      name: ts.Identifier
      initializer: ts.CallExpression
    }]
  }
}

/* Finds patterns like
* let api = nock().*
*  */
export const isNockVariableDeclarationInstantiation = (statement: ts.Node): statement is NockVariableDeclarationInstantiation => (
  ts.isVariableStatement(statement) &&
  ts.isVariableDeclaration(statement.declarationList.declarations[0]) &&
  ts.isIdentifier(statement.declarationList.declarations[0].name) &&
  ts.isCallExpression(statement.declarationList.declarations[0].initializer) &&
  isNockChainedCall(statement.declarationList.declarations[0].initializer, 'nock')
)
