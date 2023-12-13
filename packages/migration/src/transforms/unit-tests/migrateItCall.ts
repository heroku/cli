import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {ItFunctionCall} from '../../node-validators/isTestItCall.js'

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

const isNockCall = (node: ts.Node) => (
  ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.escapedText === 'nock'
)

// output an array of CallExpression/PropertyAccessExpression pairs? Just replace the "last" `nock(`?
/* finds patterns like this:
* let api = nock('https://api.heroku.com:443')
      .post('/spaces', postBody)
      .reply(201, responseBody)
*  */
const isNockChainedCall = (node: ts.Node, sourceFile: ts.SourceFile): node is ts.VariableStatement => {
  let workingNode = node
  /* nodes are "upside down" compared to human reading. Given:
  * let api = nock('https://api.heroku.com:443')
    .post('/account/keys', {public_key: key})
    .reply(200)
  * node starts as `.reply(200)`, and last CallExpression/PropertyAccessExpression pair is our target `nock('https://api.heroku.com:443')`
  * */
  while (ts.isCallExpression(workingNode) && ts.isPropertyAccessExpression(workingNode.expression)) {
    workingNode = workingNode.expression.expression
  }

  return ts.isCallExpression(workingNode) &&  ts.isIdentifier(workingNode.expression) && workingNode.expression.escapedText === 'nock'
}

const migrateNock = (callEx: ts.CallExpression) =>  {
  // ???

  return factory.updateCallExpression(
    callEx,
    callEx.expression,
    callEx.typeArguments,
    callEx.arguments,
  )
}

const findNock = (node: ts.FunctionLikeDeclaration, sourceFile: ts.SourceFile) => {
  const visitor = (innerNode: ts.Node): ts.Node => {
    if (isNockChainedCall(innerNode, sourceFile)) {
      debugger
      return innerNode
    }

    return ts.visitEachChild(innerNode, visitor, nullTransformationContext)
  }

  return ts.visitEachChild(node.body, visitor, nullTransformationContext)
}

export const migrateItCall = (node: ItFunctionCall, sourceFile: ts.SourceFile) => {
  // try bottom up creation? Start with smallest piece?
  // replace entire section? Shouldn't delete something if it's there, but how to move it? Keep track of unknown parts?
  // move ^ into a `do`? Likely not what's wanted
  const base = createTestBase()

  findNock(node.arguments[1], sourceFile)

  // todo: anyway to find nock in beforeEach? example: packages/pg-v5/test/unit/commands/maintenance/run.unit.test.js
  /* todo: handle separate definition then chaining. example: packages/pg-v5/test/unit/commands/backups/capture.unit.test.js
  * look for nock, then decide if it's one expression or multiple?
  *  */

  return node
}
