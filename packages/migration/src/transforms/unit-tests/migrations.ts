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

    const nockCalls = getNockMethodCallExpressions(node.arguments[1].body, nestedNockInBeforeEach)

    for (const nockCall of nockCalls) {
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
              // nockCall.properties.map(callEx => {
              //   return factory.createExpressionStatement(callEx)
              // }),
              [],
              true,
            ),
            // factory.createBlock(
            //   [ // map nockCall.properties
            //     factory.createExpressionStatement(factory.createCallExpression(
            //       factory.createPropertyAccessExpression(
            //         factory.createCallExpression(
            //           factory.createPropertyAccessExpression(
            //             factory.createIdentifier(nockCall.varName),
            //             factory.createIdentifier('get'),
            //           ),
            //           undefined,
            //           [factory.createStringLiteral('/apps/myapp')], //path
            //         ),
            //         factory.createIdentifier('reply'), //
            //       ),
            //       undefined,
            //       [
            //         factory.createNumericLiteral('200'),
            //         factory.createObjectLiteralExpression(
            //           [factory.createPropertyAssignment(
            //             factory.createIdentifier('maintenance'),
            //             factory.createTrue(),
            //           )],
            //           false,
            //         ),
            //       ],
            //     )),
            //   ],
            //   true,
            // ),
          ),
        ],
      )
    }

    // todo: anyway to find nock in beforeEach? example: packages/pg-v5/test/unit/commands/maintenance/run.unit.test.js
    /* todo: handle separate definition then chaining. example: packages/pg-v5/test/unit/commands/backups/capture.unit.test.js
    * look for nock, then decide if it's one expression or multiple?
    *  */

    return result
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

    const itVisitor = (iNode: ts.Node): ts.Node => {
      if (isTestItCall(iNode)) {
        return transformIts(iNode, nestedNockInBeforeEach)
      }

      return ts.visitEachChild(iNode, itVisitor, nullTransformationContext)
    }

    return ts.visitEachChild(node, itVisitor, nullTransformationContext)
  }

  return ts.visitEachChild(node, _node => transformDescribes(_node, nestedNockInBeforeEach), nullTransformationContext)
}
