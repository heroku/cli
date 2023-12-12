import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'

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
const isNockBlock = (node: ts.Node): node is ts.VariableStatement => {
  if (node && node?.getText()?.includes('nock')) {
    debugger
  }

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

const findNock = (node: ts.Node) => {
  const visitor = (innerNode: ts.Node): ts.Node => {
    if (isNockBlock(innerNode)) {
      debugger
      return innerNode
    }

    return ts.visitEachChild(innerNode, visitor, nullTransformationContext)
  }

  return ts.visitEachChild(node, visitor, nullTransformationContext)
}

export const migrateItCall = (node: ts.Node) => {
  // try bottom up creation? Start with smallest piece?
  // replace entire section? Shouldn't delete something if it's there, but how to move it? Keep track of unknown parts?
  // move ^ into a `do`? Likely not what's wanted
  const base = createTestBase()

  findNock(node)

  return node
}
