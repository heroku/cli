import ts from 'typescript'
import _ from 'lodash'
import {
  isBeforeEachBlock,
  isNockChainedCall,
  isNockExpressionStatementInstantiation,
  isNockVariableDeclarationInstantiation,
  NockVariableDeclarationInstantiation,
} from './validators.js'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {migrateCommandRun} from './migrations.js'

const {factory} = ts

export type NockIntercepts = { varName: string, domain: ts.StringLiteral, intercepts: ts.CallExpression[] }
// top level keys are varNames used when defining nock instance
export type NockInterceptsLookup = Record<string, NockIntercepts>

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

/* nodes are "upside down" compared to human reading. Given:
 * let api = nock('https://api.heroku.com:443')
   .post('/account/keys', {public_key: key})
   .reply(200)
 * node starts as `.reply(200)`, and last CallExpression/PropertyAccessExpression pair is our target `nock('https://api.heroku.com:443')`
 * */
export const getEndOfCallPropertyAccessChain = (node: ts.CallExpression): ts.Node => {
  let workingNode: ts.Node = node

  while (ts.isCallExpression(workingNode) || ts.isPropertyAccessExpression(workingNode)) {
    workingNode = workingNode.expression
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
      intercepts: [stripNockFromCallAccessChain(nockCallEx, varName)],
    }
  }

  // this should never happen as the `if` of this `else` is mostly to soothe TS
  throw new Error('createNockNameCallPairFromVarDeclInstantiation: found nock with unexpected shape')
}

export const getNockCallsFromBlock = (block: ts.Block, nestedNockInBeforeEach: NockInterceptsLookup) => {
  // clone deeply here to avoid modifying anything that is passed by reference from separate node branches
  nestedNockInBeforeEach = _.cloneDeep<NockInterceptsLookup>(nestedNockInBeforeEach)
  for (const statement of block.statements) {
    if (isNockExpressionStatementInstantiation(statement)) {
      const varName = statement.expression.left.escapedText.toString()
      if (nestedNockInBeforeEach[varName]) {
        debugger
      }

      nestedNockInBeforeEach[varName] = {
        varName: statement.expression.left.escapedText.toString(),
        domain: statement.expression.right.arguments[0],
        intercepts: [],
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
          nestedNockInBeforeEach[varName].intercepts.push(statement.expression)
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
export const getNockCallsFromBeforeEach = (block: ts.Block, nestedNockInBeforeEach: NockInterceptsLookup): NockInterceptsLookup => {
  for (const describeStatement of block.statements) {
    if (isBeforeEachBlock(describeStatement)) {
      return getNockCallsFromBlock(describeStatement.expression.arguments[0].body, nestedNockInBeforeEach)
    }
  }

  return nestedNockInBeforeEach
}

// export const addNockToCallChain = (existing: ts.CallExpression, nockCall: NockIntercepts) => factory.createCallExpression(
//   factory.createPropertyAccessExpression(
//     existing,
//     factory.createIdentifier('nock'),
//   ),
//   undefined,
//   [
//     nockCall.domain, // domain nock is instantiated with
//     factory.createArrowFunction(
//       undefined,
//       undefined,
//       [factory.createParameterDeclaration(
//         undefined,
//         undefined,
//         factory.createIdentifier(nockCall.varName),
//       )],
//       undefined,
//       factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), // "=>" in arrow function
//       factory.createBlock(
//         nockCall.intercepts.map(callEx => {
//           return factory.createExpressionStatement(callEx) // this may not work in other places
//         }),
//         // [],
//         true,
//       ),
//     ),
//   ],
// )

// looks for this pattern regardless of beginning of ExpressionStatement:
// *.run({})
const findCommandRun = (node: ts.Node): ts.ObjectLiteralExpression | undefined => {
  let commandRun: ts.ObjectLiteralExpression
  const visitor = (vNode: ts.Node): ts.Node | undefined => {
    if (ts.isCallExpression(vNode)) {
      const terminus = getEndOfCallPropertyAccessChain(vNode)
      if (
        ts.isPropertyAccessExpression(terminus.parent) &&
        ts.isIdentifier(terminus.parent.name) &&
        terminus.parent.name.escapedText.toString() === 'run' &&
        ts.isCallExpression((terminus.parent.parent)) &&
        ts.isObjectLiteralExpression(terminus.parent.parent.arguments[0])
      ) {
        commandRun = terminus.parent.parent.arguments[0]
        return
      }
    }

    return ts.visitEachChild(vNode, visitor, nullTransformationContext)
  }

  visitor(node)

  return commandRun
}

// looks for this pattern regardless of beginning of ExpressionStatement:
// expect(*).*
const findExpects = (node: ts.Node): ts.CallExpression[] => {
  const expects:  ts.CallExpression[] = []

  const visitor = (vNode: ts.Node): ts.Node => {
    if (ts.isCallExpression(vNode)) {
      const terminus = getEndOfCallPropertyAccessChain(vNode)
      if (
        ts.isIdentifier(terminus) &&
        terminus.escapedText.toString() === 'expect' &&
        ts.isCallExpression((terminus.parent))
      ) {
        expects.push(vNode)
        // found it, don't continue down chain and push duplicates in call/propertyAccess chain
        return vNode
      }
    }

    return ts.visitEachChild(vNode, visitor, nullTransformationContext)
  }

  visitor(node)

  return expects
}

// export const getCommandRunAndExpects = (itBlock: ts.Block, commandName: string) => {
//   const commandArr: ReturnType<typeof migrateCommandRun> = [commandName]
//   const catchCalls: ts.CallExpression[] = []
//   const expects: ts.CallExpression[] = []
//
//   for (const statement of itBlock.statements) {
//     const runArgs = findCommandRun(statement)
//     if (runArgs) {
//       if (commandArr.length > 1) {
//         debugger
//       }
//
//       commandArr.push(...migrateCommandRun(runArgs))
//     }
//
//     if (ts.isReturnStatement(statement) && ts.isCallExpression(statement.expression)) {
//       let workingNode: ts.Node = statement.expression
//       while (ts.isCallExpression(workingNode) && ts.isPropertyAccessExpression(workingNode.expression) && ts.isIdentifier(workingNode.expression.name)) {
//         const callName = workingNode.expression.name.escapedText.toString()
//         if (callName === 'catch') {
//           // pass along as they are
//           catchCalls.push(workingNode)
//         } else if (callName === 'then') {
//           expects.push(...findExpects(workingNode.arguments[0]))
//         }
//
//         workingNode = workingNode.expression.expression
//       }
//     }
//   }
//
//   return {commandArr, expects, catchCalls}
// }

export const transformNode = <N extends ts.Node>(node: N, transform: (innerNode: ts.Node) => ts.Node) => {
  const visitor = (vNode: ts.Node): ts.Node => {
    return ts.visitEachChild(transform(vNode), visitor, nullTransformationContext)
  }

  return ts.visitEachChild(node, visitor, nullTransformationContext)
}
