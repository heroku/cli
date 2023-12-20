import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {isTestDescribeOrContextCall, isTestItCall} from './validators.js'
import {
  addNockToCallChain,
  getCommandRunAndExpects,
  getNockCallsFromBeforeEach,
  getNockCallsFromBlock,
  NockInterceptsLookup,
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

const transformIts = (node: ts.CallExpression, nestedNockInBeforeEach: NockInterceptsLookup, commandName: string): ts.CallExpression => {
  if (isTestItCall(node)) {
    // replace entire section? Shouldn't delete something if it's there, but how to move it? Keep track of unknown parts?
    // move ^ into a `do`? Likely not what's wanted
    let result = createTestBase()

    const nockCalls = getNockCallsFromBlock(node.arguments[1].body, nestedNockInBeforeEach)
    const commandAndAsserts = getCommandRunAndExpects(node.arguments[1].body, commandName)

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

export const transformDescribesContextsAndIts = (node: ts.Node, commandName: string, foundNockData: NockInterceptsLookup = {}): (ts.SourceFile | ts.Node) => {
  // nothing interesting, continue visiting nodes
  if (!isTestDescribeOrContextCall(node)) {
    return ts.visitEachChild(
      node,
      vNode => transformDescribesContextsAndIts(vNode, commandName, foundNockData),
      nullTransformationContext,
    )
  }

  /*
  * Everything below is a bit awkward. We need to get nock info from beforeEach children in the describe/context
  * and pass what we find into other children (siblings of beforeEach).
  * We also need to flatten/hoist it() statements to parent describe/context statements to preserve anything defined there. These
  * flattened statements will almost certainly be "wrong" in the output and will require dev effort to determine what to do with them.
  *  */

  // only pass found nock calls from beforeEach into children of describe/context
  const newNockData = getNockCallsFromBeforeEach(node.arguments[1].body, foundNockData)
  const newStatements: (ts.Statement | ts.Node)[] = []
  for (const statement of node.arguments[1].body.statements) {
    if (ts.isExpressionStatement(statement) && isTestItCall(statement.expression)) {
      newStatements.push(
        factory.createExpressionStatement(transformIts(statement.expression, newNockData, commandName)),
        // move it() block statements up to parent describe/context
        ...statement.expression.arguments[1].body.statements.filter(() => {
          // todo: filter out expressions used for nock/command.run/etc
          return true
        }),
      )
    } else {
      // recursively call transformDescribesContextsAndIts on statements directly
      newStatements.push(transformDescribesContextsAndIts(statement, commandName, newNockData))
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

export const migrateCommandRun = (prop: ts.ObjectLiteralElementLike): (string | ts.Expression)[] => {
  if (!ts.isIdentifier(prop.name)) {
    // this should never happen
    throw new Error('unexpected migrateCommandRun input')
  }

  const isShorthand = ts.isShorthandPropertyAssignment(prop)
  const isLongHand = ts.isPropertyAssignment(prop)

  if (!(isShorthand || isLongHand)) {
    return []
  }

  // check ShorthandPropertyAssignment vs PropertyAssignment
  switch (prop.name.escapedText.toString()) {
  case 'app':
    if (isShorthand) {
      return ['--app', prop.name]
    }

    return ['--app', prop.initializer]

  case 'flags': {
    const transformed: ReturnType<typeof migrateCommandRun> = []

    if (isLongHand && ts.isObjectLiteralExpression(prop.initializer)) {
      for (const flagProp of prop.initializer.properties) {
        if (ts.isIdentifier(flagProp.name)) {
          transformed.push(`--${flagProp.name.escapedText.toString()}`)
          if (ts.isShorthandPropertyAssignment(flagProp)) {
            transformed.push(flagProp.name)
          } else if (ts.isPropertyAssignment(flagProp)) {
            transformed.push(prop.initializer)
          } else {
            console.error('deeply nested issue in migrateCommandRun')
          }
        }
      }
    } else {
      // todo: could spread and transform, but will be a nightmare to create via TS
      console.error('can not map command.run({flags})) short hand property assignment')
    }

    return transformed
  }

  case 'args':
    if (isLongHand && ts.isArrayLiteralExpression(prop.initializer)) {
      return [...prop.initializer.elements]
    }

    if (isShorthand) {
      return [factory.createSpreadElement(prop.name)]
    }

    // todo: could spread and transform, but will be a nightmare to create via TS
    console.error('can not map command.run({args})) short hand property assignment')
    return []

  default:
    return []
  }
}
