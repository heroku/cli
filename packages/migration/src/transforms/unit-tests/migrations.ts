import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {isTestDescribeOrContextCall, isTestItCall} from './validators.js'
import {
  getNockCallsFromDescribe,
  addNockToCallChain,
  NockNameCallPairLookup, getNockCallsFromBlock,
} from './helpers.js'

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

const transformIts = (node: ts.Node, nestedNockInBeforeEach: NockNameCallPairLookup): ts.Node => {
  if (isTestItCall(node)) {
    // replace entire section? Shouldn't delete something if it's there, but how to move it? Keep track of unknown parts?
    // move ^ into a `do`? Likely not what's wanted
    let result = createTestBase()

    const nockCalls = getNockCallsFromBlock(node.arguments[1].body, nestedNockInBeforeEach)

    for (const nockCall of Object.values(nockCalls)) {
      if (nockCall.properties.length > 0) {
        result = addNockToCallChain(result, nockCall)
      }
    }

    return result
  }

  return node
}

export const transformDescribesContextsAndIts = (node: ts.Node, foundNockData: NockNameCallPairLookup = {}): ts.Node => {
  if (isTestDescribeOrContextCall(node)) {
    // only pass found nock calls from beforeEach into children of describe/context
    const newNockData = getNockCallsFromDescribe(node.arguments[1].body, foundNockData)
    return factory.updateCallExpression(
      node,
      node.expression,
      node.typeArguments,
      [
        node.arguments[0],
        // second arg is a function or arrow function. We don't care and just want to update the body. Not sure what to do besides ignore TS here.
        {
          ...node.arguments[1],
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          body: factory.updateBlock(
            node.arguments[1].body,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            node.arguments[1].body.statements.map(iNode => transformDescribesContextsAndIts(iNode, newNockData)),
          ),
        },
      ],
    )
  }

  if (isTestItCall(node)) {
    // terminate recursion and transformIt in place
    return transformIts(node, foundNockData)
  }

  return ts.visitEachChild(node, _node => transformDescribesContextsAndIts(_node, foundNockData), nullTransformationContext)
}
