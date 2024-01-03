import ts from 'typescript'

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

