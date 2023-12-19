import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {isTestDescribeOrContextCall, isTestItCall} from './validators.js'
import {
  getNockCallsFromBeforeEach,
  addNockToCallChain,
  NockInterceptsLookup, getNockCallsFromBlock,
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

const transformIts = (node: ts.CallExpression, nestedNockInBeforeEach: NockInterceptsLookup): ts.CallExpression => {
  if (isTestItCall(node)) {
    // replace entire section? Shouldn't delete something if it's there, but how to move it? Keep track of unknown parts?
    // move ^ into a `do`? Likely not what's wanted
    let result = createTestBase()

    const nockCalls = getNockCallsFromBlock(node.arguments[1].body, nestedNockInBeforeEach)

    for (const nockCall of Object.values(nockCalls)) {
      if (nockCall.intercepts.length > 0) {
        result = addNockToCallChain(result, nockCall)
      }
    }

    return factory.createCallExpression(
      factory.createPropertyAccessExpression(
        result,
        factory.createIdentifier('it'),
      ),
      undefined,
      [
        node.arguments[0], // it description string literal
        factory.createArrowFunction(
          undefined,
          undefined,
          [factory.createParameterDeclaration(
            undefined,
            undefined,
            factory.createObjectBindingPattern([
              factory.createBindingElement(
                undefined,
                undefined,
                factory.createIdentifier('stderr'),
              ),
              factory.createBindingElement(
                undefined,
                undefined,
                factory.createIdentifier('stdout'),
              ),
            ]),
          )],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createBlock(
            [], // todo: transform & add expects
            true,
          ),
        ),
      ],
    )
  }

  return node
}

/* must keep track of all nock calls in potential patterns like this with nested describe/context beforeEach calls:
let api
describe('string', function () {
    beforeEach(() => {
        api = nock('domain')
        api.get('path').reply(200, response)
    })
    describe('string2', function () {
        let otherAPI
        beforeEach(() => {
            otherAPI = nock('domain')
            otherAPI.get('path').reply(200, response)
        })
        it('string', function () {
            otherAPI.post('otherPath').reply(200, otherResponse)
            api.post('path').reply(200, response)
        })
        context(() => {
            let thirdNockInstance
            beforeEach(() => {
                api = nock('domain')
                api.get('path').reply(200, response)
            })
            it('string', function () {
                thirdNockInstance.post('otherPath').repply(200, otherResponse)
                api.post('path').reply(200, response)
            })
        })
        context(() => {
            beforeEach(() => {
                api = nock('domain')
                api.get('path').reply(200, response)
            })
            it('string', function () {
                otherAPI.post('otherPath').repply(200, otherResponse)
                thirdNockInstance.post('path').reply(200, response)
            })
        })
    })
})
*
* output:

*  */
export const transformDescribesContextsAndIts = (node: ts.Node, foundNockData: NockInterceptsLookup = {}): ts.Node => {
  // nothing interesting, continue visiting nodes
  if (!isTestDescribeOrContextCall(node)) {
    return ts.visitEachChild(
      node,
      vNode => transformDescribesContextsAndIts(vNode, foundNockData),
      nullTransformationContext,
    )
  }

  /*
  * Everything below is a bit awkward. We need to get nock info from beforeEach children in the describe/context
  * and pass what we find into other children (siblings of beforeEach).
  * We also need to flatten/hoist it() statements to parent describe/context statements to preserve anything defined there. These
  * statements will almost certainly be "wrong" in the output and will require dev effort to determine what to do with them.
  *  */

  // only pass found nock calls from beforeEach into children of describe/context
  const newNockData = getNockCallsFromBeforeEach(node.arguments[1].body, foundNockData)
  const newStatements: (ts.Statement | ts.Node)[] = []
  for (const statement of node.arguments[1].body.statements) {
    if (ts.isExpressionStatement(statement) && isTestItCall(statement.expression)) {
      newStatements.push(
        factory.createExpressionStatement(transformIts(statement.expression, newNockData)),
        // move it() block statements up to parent describe/context
        ...statement.expression.arguments[1].body.statements,
      )
    } else {
      // recursively call transformDescribesContextsAndIts on statements directly
      newStatements.push(transformDescribesContextsAndIts(statement, newNockData))
    }
  }

  return factory.updateCallExpression(
    node,
    node.expression,
    node.typeArguments,
    [
      node.arguments[0],
      // second arg is a function or arrow function. We don't care and just want to update the body that has been confirmed to exist.
      {
        ...node.arguments[1],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        body: factory.updateBlock(
          node.arguments[1].body,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          newStatements,
        ),
      },
    ],
  )
}
