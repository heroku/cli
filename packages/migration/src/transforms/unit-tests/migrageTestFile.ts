import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {isTestDescribeCall} from './validators.js'

const {factory} = ts

const transformNode = <N extends ts.Node>(node: N, transform: (innerNode: ts.Node) => ts.Node) => {
  const visitor = (vNode: ts.Node): ts.Node => ts.visitEachChild(transform(vNode), visitor, nullTransformationContext)

  return ts.visitEachChild(node, visitor, nullTransformationContext)
}

const getNockCallsFromBeforeEach = (describeBlock: ts.Block) => {
  const nockVarNames: {varName: string, call: ts.CallExpression}[] = []
  for (const describeStatement of describeBlock.statements) {
    if (
      ts.isExpressionStatement(describeStatement) &&
      ts.isCallExpression(describeStatement.expression) &&
      ts.isIdentifier(describeStatement.expression.expression) &&
      describeStatement.expression.expression.escapedText === 'beforeEach' &&
      ts.isFunctionLike(describeStatement.expression.arguments[0]) &&
      ts.isBlock(describeStatement.expression.arguments[0].body)
    ) {
      const beforeEachStatements = describeStatement.expression.arguments[0].body.statements
      for (const beforeEachStatement of beforeEachStatements) {
        if (
          ts.isExpressionStatement(beforeEachStatement) &&
          ts.isBinaryExpression(beforeEachStatement.expression) &&
          ts.isCallExpression(beforeEachStatement.expression.right) &&
          ts.isIdentifier(beforeEachStatement.expression.right.expression) &&
          ts.isIdentifier(beforeEachStatement.expression.left) &&
          beforeEachStatement.expression.right.expression.escapedText === 'nock'
        ) {
          nockVarNames.push({
            varName: beforeEachStatement.expression.left.escapedText.toString(),
            call: beforeEachStatement.expression.right,
          })
        }
      }
    }
  }

  return nockVarNames
}

const transformDescribe = (node: ts.Node) => {
  if (isTestDescribeCall(node)) {
    const nockReferences = getNockCallsFromBeforeEach(node.arguments[1].body)

    return node
  }

  return node
}

export const migrateTestFile = (sourceFile: ts.SourceFile): ts.SourceFile => {
  const transformed = transformNode(sourceFile, transformDescribe)

  return transformed
}
