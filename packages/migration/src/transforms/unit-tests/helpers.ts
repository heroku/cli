import ts from 'typescript'
import {
  isBeforeEachBlock,
  isNockChainedCall,
  isNockExpressionStatementInstantiation,
  isNockVariableDeclarationInstantiation, NockVariableDeclarationInstantiation,
} from './validators.js'
import {nullTransformationContext} from '../../nullTransformationContext.js'

const {factory} = ts

export type NockNameCallPair = { varName: string, domain: ts.StringLiteral, properties: ts.CallExpression[] }
export type NockNameCallPairLookup = Record<string, NockNameCallPair>

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

export const createNockNameCallPairFromVarDeclInstantiation = (statement: NockVariableDeclarationInstantiation) => {
  const varName = statement.declarationList.declarations[0].name.escapedText.toString()
  const nockCallEx = statement.declarationList.declarations[0].initializer
  const nockCallTerminus = getEndOfCallPropertyAccessChain(nockCallEx)
  if (ts.isCallExpression(nockCallTerminus) && ts.isStringLiteral(nockCallTerminus.arguments[0])) {
    return {
      varName,
      domain: nockCallTerminus.arguments[0],
      properties: [stripNockFromCallAccessChain(nockCallEx, varName)],
    }
  }

  // this should never happen as the `if` of this `else` is mostly to soothe TS
  throw new Error('createNockNameCallPairFromVarDeclInstantiation: found nock with unexpected shape')
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
export const getNockCallsFromBlock = (block: ts.Block, nestedNockInBeforeEach: NockNameCallPair[][]) => {
  const nockVarNames: NockNameCallPair[] = []
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

  for (const describeStatement of block.statements) {
    if (isBeforeEachBlock(describeStatement)) {
      const beforeEachStatements = describeStatement.expression.arguments[0].body.statements
      for (const beforeEachStatement of beforeEachStatements) {
        if (isNockExpressionStatementInstantiation(beforeEachStatement)) {
          nockVarNames.push({
            varName: beforeEachStatement.expression.left.escapedText.toString(),
            domain: beforeEachStatement.expression.right.arguments[0],
            properties: [],
          })
        } else if (isNockVariableDeclarationInstantiation(beforeEachStatement)) {
          nockVarNames.push(createNockNameCallPairFromVarDeclInstantiation(beforeEachStatement))
        } else {
          for (const nockPair of callPairs) {
            // case: api.post().reply() where api is declared elsewhere
            if (
              ts.isExpressionStatement(beforeEachStatement) &&
              ts.isCallExpression(beforeEachStatement.expression) &&
              isNockChainedCall(beforeEachStatement.expression, nockPair.varName)
            ) {
              nockPair.properties.push(beforeEachStatement.expression)
            }
          }
      }
    }
  }

  return nockVarNames
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
    if (isNockVariableDeclarationInstantiation(statement)) {
      callPairs.push(createNockNameCallPairFromVarDeclInstantiation(statement))
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

export const addNockToCallChain = (existing: ts.CallExpression, nockCall: NockNameCallPair) => factory.createCallExpression(
  factory.createPropertyAccessExpression(
    existing,
    factory.createIdentifier('nock'),
  ),
  undefined,
  [
    nockCall.domain, // domain nock is instantiated with
    factory.createArrowFunction(
      undefined,
      undefined,
      [factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createIdentifier(nockCall.varName),
      )],
      undefined,
      factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), // "=>" in arrow function
      factory.createBlock(
        nockCall.properties.map(callEx => {
          return factory.createExpressionStatement(callEx) // this may not work in other places
        }),
        // [],
        true,
      ),
    ),
  ],
)
