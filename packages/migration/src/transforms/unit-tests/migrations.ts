import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {isTestDescribeOrContextCall, isTestItCall} from './validators.js'
import {getNockMethodCallExpressions, getNockCallsFromBeforeEach, NockNameCallPair} from './helpers.js'
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
    // try bottom up creation? Start with smallest piece?
    // replace entire section? Shouldn't delete something if it's there, but how to move it? Keep track of unknown parts?
    // move ^ into a `do`? Likely not what's wanted
    let result = createTestBase()

    // clone deeply here to avoid modifying anything that is passed by reference downstream
    const clonedNestedNockInBeforeEach = _.cloneDeep<typeof nestedNockInBeforeEach>(nestedNockInBeforeEach)
    const nockCalls = getNockMethodCallExpressions(node.arguments[1].body, clonedNestedNockInBeforeEach)

    for (const nockCall of nockCalls) {
      if (nockCall.properties.length > 0) {
        result = factory.createCallExpression(
          factory.createPropertyAccessExpression(
            result,
            factory.createIdentifier('nock'),
          ),
          undefined,
          [
            nockCall.instanceCall.arguments[0], // domain nock is instantiated with
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
      }
    }

    // todo: anyway to find nock in beforeEach? example: packages/pg-v5/test/unit/commands/maintenance/run.unit.test.js
    /* todo: handle separate definition then chaining. example: packages/pg-v5/test/unit/commands/backups/capture.unit.test.js
    * look for nock, then decide if it's one expression or multiple?
    *  */

    return result
  }

  return node
}

export const transformDescribesContextsAndIts = (node: ts.Node, nestedNockInBeforeEach: NockNameCallPair[][] = []): ts.Node => {
  if (isTestDescribeOrContextCall(node)) {
    const nockInBeforeEach = getNockCallsFromBeforeEach(node.arguments[1].body)
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
