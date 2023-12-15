import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {isTestDescribeOrContextCall, isTestItCall} from './validators.js'
import {getNockMethodCallExpressions, getNockCallsFromBlock, NockNameCallPair, addNockToCallChain} from './helpers.js'
import _ from 'lodash'

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

export const transformNode = <N extends ts.Node>(node: N, transform: (innerNode: ts.Node) => ts.Node) => {
  const visitor = (vNode: ts.Node): ts.Node => {
    return ts.visitEachChild(transform(vNode), visitor, nullTransformationContext)
  }

  return ts.visitEachChild(node, visitor, nullTransformationContext)
}

const transformIts = (node: ts.Node, nestedNockInBeforeEach: NockNameCallPair[][]): ts.Node => {
  if (isTestItCall(node)) {
    // replace entire section? Shouldn't delete something if it's there, but how to move it? Keep track of unknown parts?
    // move ^ into a `do`? Likely not what's wanted
    let result = createTestBase()

    // clone deeply here to avoid modifying anything that is passed by reference downstream
    const clonedNestedNockInBeforeEach = _.cloneDeep<typeof nestedNockInBeforeEach>(nestedNockInBeforeEach)
    const nockCalls = getNockMethodCallExpressions(node.arguments[1].body, clonedNestedNockInBeforeEach)

    for (const nockCall of nockCalls) {
      if (nockCall.properties.length > 0) {
        result = addNockToCallChain(result, nockCall)
      }
    }

    return result
  }

  return node
}

export const transformDescribesContextsAndIts = (node: ts.Node, nestedNockInBeforeEach: NockNameCallPair[][] = []): ts.Node => {
  if (isTestDescribeOrContextCall(node)) {
    const nockInBeforeEach = getNockCallsFromBlock(node.arguments[1].body, nestedNockInBeforeEach)
    if (nockInBeforeEach.length > 0) {
      nestedNockInBeforeEach = [...nestedNockInBeforeEach, nockInBeforeEach]
    }
  }

  if (isTestItCall(node)) {
    // terminate recursion and transformIt in place
    return transformIts(node, nestedNockInBeforeEach)
  }

  return ts.visitEachChild(node, _node => transformDescribesContextsAndIts(_node, nestedNockInBeforeEach), nullTransformationContext)
}
