import ts from 'typescript'

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

const migrateNock = (callEx: ts.CallExpression) =>  {
  // ???

  return factory.updateCallExpression(
    callEx,
    callEx.expression,
    callEx.typeArguments,
    callEx.arguments,
  )
}

export const migrateItCall = (node: ts.Node) => {
  const base = createTestBase()

  return base
}
