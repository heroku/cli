import ts from 'typescript'
import {
  isBeforeEachBlock,
  isNockChainedCall,
  isNockExpressionStatementInstantiation,
  isNockVariableDeclarationInstantiation, NockVariableDeclarationInstantiation,
} from './validators.js'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import _ from 'lodash'

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

export const getNockCallsFromBlock = (block: ts.Block, nestedNockInBeforeEach: NockNameCallPairLookup) => {
  // clone deeply here to avoid modifying anything that is passed by reference from separate node branches
  nestedNockInBeforeEach = _.cloneDeep<NockNameCallPairLookup>(nestedNockInBeforeEach)
  for (const statement of block.statements) {
    if (isNockExpressionStatementInstantiation(statement)) {
      const varName = statement.expression.left.escapedText.toString()
      if (nestedNockInBeforeEach[varName]) {
        debugger
      }

      nestedNockInBeforeEach[varName] = {
        varName: statement.expression.left.escapedText.toString(),
        domain: statement.expression.right.arguments[0],
        properties: [],
      }
    } else if (isNockVariableDeclarationInstantiation(statement)) {
      const nockPair = createNockNameCallPairFromVarDeclInstantiation(statement)
      if (nestedNockInBeforeEach[nockPair.varName]) {
        debugger
      }

      nestedNockInBeforeEach[nockPair.varName] = nockPair
    } else {
      for (const varName in nestedNockInBeforeEach) {
        // case: api.post().reply() where api is declared elsewhere
        if (
          ts.isExpressionStatement(statement) &&
          ts.isCallExpression(statement.expression) &&
          isNockChainedCall(statement.expression, varName)
        ) {
          nestedNockInBeforeEach[varName].properties.push(statement.expression)
        }
      }
    }
  }

  return nestedNockInBeforeEach
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
export const getNockCallsFromBeforeEach = (block: ts.Block, nestedNockInBeforeEach: NockNameCallPairLookup): NockNameCallPairLookup => {
  for (const describeStatement of block.statements) {
    if (isBeforeEachBlock(describeStatement)) {
      return getNockCallsFromBlock(describeStatement.expression.arguments[0].body, nestedNockInBeforeEach)
    }
  }

  return nestedNockInBeforeEach
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
