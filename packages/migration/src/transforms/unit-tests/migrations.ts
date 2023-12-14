import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {isTestDescribeCall, isTestItCall, TestFunctionCall} from './validators.js'
import {getNockMethodCallExpressions, getNockCallsFromBeforeEach, NockNameCallPair} from './helpers.js'

const {factory} = ts

const createTestBase = () => factory.createCallExpression(
  factory.createPropertyAccessExpression(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier('test'),
        factory.createIdentifier('stderr'),
      ),
      undefined,
      [],
    ),
    factory.createIdentifier('stdout'),
  ),
  undefined,
  [],
)

export const migrations = (itCall: TestFunctionCall<'it'>, nestedNockInBeforeEach: NockNameCallPair[][]) => {
  // try bottom up creation? Start with smallest piece?
  // replace entire section? Shouldn't delete something if it's there, but how to move it? Keep track of unknown parts?
  // move ^ into a `do`? Likely not what's wanted
  const base = createTestBase()

  const nockCalls = getNockMethodCallExpressions(itCall.arguments[1].body, nestedNockInBeforeEach)

  // todo: anyway to find nock in beforeEach? example: packages/pg-v5/test/unit/commands/maintenance/run.unit.test.js
  /* todo: handle separate definition then chaining. example: packages/pg-v5/test/unit/commands/backups/capture.unit.test.js
  * look for nock, then decide if it's one expression or multiple?
  *  */

  return base
}

export const transformNode = <N extends ts.Node>(node: N, transform: (innerNode: ts.Node) => ts.Node) => {
  const visitor = (vNode: ts.Node): ts.Node => ts.visitEachChild(transform(vNode), visitor, nullTransformationContext)

  return ts.visitEachChild(node, visitor, nullTransformationContext)
}

const transformIts = (node: ts.Node, nestedNockInBeforeEach: NockNameCallPair[][]): ts.Node => {
  if (isTestItCall(node)) {
    return migrations(node, nestedNockInBeforeEach)
  }

  if (isTestDescribeCall(node)) {
    return transformDescribes(node, nestedNockInBeforeEach)
  }

  return ts.visitEachChild(node, _node => transformIts(_node, nestedNockInBeforeEach), nullTransformationContext)
}

// can be called recursively through `transformIts` as describe blocks can be nested
export const transformDescribes = (node: ts.Node, nestedNockInBeforeEach: NockNameCallPair[][] = []): ts.Node => {
  if (isTestDescribeCall(node)) {
    const nockInBeforeEach = getNockCallsFromBeforeEach(node.arguments[1].body)
    if (nockInBeforeEach.length > 0) {
      nestedNockInBeforeEach.push(nockInBeforeEach)
    }

    return transformIts(node, nestedNockInBeforeEach)
  }

  return ts.visitEachChild(node, _node => transformDescribes(_node, nestedNockInBeforeEach), nullTransformationContext)
}
