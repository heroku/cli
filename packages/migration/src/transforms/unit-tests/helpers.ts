import ts from 'typescript'
import {isBeforeEachBlock, isNockChainedCall} from './validators.js'
import {nullTransformationContext} from '../../nullTransformationContext.js'

const {factory} = ts

export type NockNameCallPair = { varName: string, instanceCall: ts.CallExpression, properties: ts.CallExpression[] }

/* gets nock calls and assigned variable names from this pattern
let api
let pg

beforeEach(() => {
  api = nock('https://api.heroku.com')
  pg = nock('https://postgres-api.heroku.com')
  cli.mockConsole()
})
* *  */
export const getNockCallsFromBeforeEach = (describeBlock: ts.Block) => {
  const nockVarNames: NockNameCallPair[] = []
  // todo: find nested describe calls and use recursion to do...??
  for (const describeStatement of describeBlock.statements) {
    if (isBeforeEachBlock(describeStatement)) {
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
            instanceCall: beforeEachStatement.expression.right,
            properties: [],
          })
        }
      }
    }
  }

  return nockVarNames
}

const stripNockFromCallAccessChain = (callEx: ts.CallExpression, varName: string): ts.CallExpression => {
  const visitor = (node: ts.Node): ts.Node => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.escapedText.toString() === 'nock'
    ) {
      return factory.createIdentifier(varName)
    }

    return ts.visitEachChild(node, visitor, nullTransformationContext)
  }

  return ts.visitEachChild(callEx, visitor, nullTransformationContext)
}

export const getNockMethodCallExpressions = (itBlock: ts.Block, nestedNockInBeforeEach: NockNameCallPair[][]) => {
  const callPairsHash = nestedNockInBeforeEach
    .flat()
    .reduce<Record<string, NockNameCallPair>>((acc, callPair) => {
      const exists = acc[callPair.varName]
      if (exists) {
        acc[callPair.varName] = {...exists, properties: [...exists.properties, ...callPair.properties]}
      } else {
        acc[callPair.varName] = callPair
      }

      return acc
    }, {})

  const callPairs = Object.values(callPairsHash)

  for (const statement of itBlock.statements) {
    if (
      // case let api = nock().*
      ts.isVariableStatement(statement) &&
      ts.isVariableDeclaration(statement.declarationList.declarations[0]) &&
      ts.isIdentifier(statement.declarationList.declarations[0].name) &&
      ts.isCallExpression(statement.declarationList.declarations[0].initializer) &&
      isNockChainedCall(statement.declarationList.declarations[0].initializer, 'nock')
    ) {
      const varName = statement.declarationList.declarations[0].name.escapedText.toString()
      const nockCallEx = statement.declarationList.declarations[0].initializer
      callPairs.push({
        varName,
        instanceCall: getEndOfCallPropertyAccessChain(nockCallEx) as ts.CallExpression,
        properties: [stripNockFromCallAccessChain(nockCallEx, varName)],
      })
    } else {
      for (const nockPair of callPairs) {
        // case: api.post().reply() where api is declared elsewhere
        if (
          ts.isExpressionStatement(statement) &&
          ts.isCallExpression(statement.expression) &&
          isNockChainedCall(statement.expression, nockPair.varName)
        ) {
          nockPair.properties.push(statement.expression)
        }
      }
    }
  }

  return callPairs
}

export const getEndOfCallPropertyAccessChain = (node: ts.CallExpression): ts.Node => {
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

  return workingNode
}
