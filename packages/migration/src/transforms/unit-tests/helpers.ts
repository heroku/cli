import ts from 'typescript'
import {isBeforeEachBlock, isNockChainedCall, isNockVariableStatement} from './validators.js'

export type NockNameCallPair = { varName: string, instanceCall: ts.CallExpression, properties: ts.CallExpression[] }
export const searchBlock = (block: ts.Block, validator: (node: ts.Node) => boolean, doSomething: (node: ts.Node) => any) => {
  for (const statement of block.statements) {
    if (validator(statement)) {
      doSomething(statement)
    }
  }
}

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

export const getNockMethodCallExpressions = (itBlock: ts.Block, nestedNockInBeforeEach: NockNameCallPair[][]) => {
  const nockCalls: NockNameCallPair[] = []
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
    for (const nockPair of callPairs) {
      if (ts.isExpressionStatement(statement) &&
        ts.isCallExpression(statement.expression) &&
        isNockChainedCall(statement.expression, nockPair.varName)) {
        nockPair.properties.push(statement.expression)
        debugger
      }
      // repurpose getNockCallsFromBeforeEach here
    }

    // for (const callPair of callPairsHash) {}
  }

  return callPairs
}
