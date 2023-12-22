import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {
  BeforeEachCall,
  isBeforeEachBlock,
  isTestDescribeOrContextCall,
  isTestItCall,
  TestFunctionCall,
} from './validators.js'
// import {
//   addNockToCallChain,
//   getCommandRunAndExpects, getEndOfCallPropertyAccessChain,
//   getNockCallsFromBeforeEach,
//   getNockCallsFromBlock,
//   NockInterceptsLookup,
// } from './helpers.js'

const {factory} = ts

// const createTestBase = () => factory.createCallExpression(
//   factory.createPropertyAccessExpression(
//     factory.createCallExpression(
//       factory.createPropertyAccessExpression(
//         factory.createIdentifier('test'),
//         factory.createIdentifier('stderr'),
//       ),
//       undefined,
//       [],
//     ),
//     factory.createIdentifier('stdout'),
//   ),
//   undefined,
//   [],
// )
//
// const transformIts = (node: ts.CallExpression, nestedNockInBeforeEach: NockInterceptsLookup, commandName: string): ts.CallExpression => {
//   if (isTestItCall(node)) {
//     // replace entire section? Shouldn't delete something if it's there, but how to move it? Keep track of unknown parts?
//     // move ^ into a `do`? Likely not what's wanted
//     let result = createTestBase()
//
//     const nockCalls = getNockCallsFromBlock(node.arguments[1].body, nestedNockInBeforeEach)
//     const commandAndAsserts = getCommandRunAndExpects(node.arguments[1].body, commandName)
//
//     for (const nockCall of Object.values(nockCalls)) {
//       if (nockCall.intercepts.length > 0) {
//         result = addNockToCallChain(result, nockCall)
//       }
//     }
//
//     return factory.createCallExpression(
//       factory.createPropertyAccessExpression(
//         result,
//         factory.createIdentifier('it'),
//       ),
//       undefined,
//       [
//         node.arguments[0], // it description string literal
//         factory.createArrowFunction(
//           undefined,
//           undefined,
//           [factory.createParameterDeclaration(
//             undefined,
//             undefined,
//             factory.createObjectBindingPattern([
//               factory.createBindingElement(
//                 undefined,
//                 undefined,
//                 factory.createIdentifier('stderr'),
//               ),
//               factory.createBindingElement(
//                 undefined,
//                 undefined,
//                 factory.createIdentifier('stdout'),
//               ),
//             ]),
//           )],
//           undefined,
//           factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
//           factory.createBlock(
//             [], // todo: transform & add expects
//             true,
//           ),
//         ),
//       ],
//     )
//   }
//
//   return node
// }
//
// export const transformDescribesContextsAndIts = (node: ts.Node, commandName: string, foundNockData: NockInterceptsLookup = {}): (ts.SourceFile | ts.Node) => {
//   // nothing interesting, continue visiting nodes
//   if (!isTestDescribeOrContextCall(node)) {
//     return ts.visitEachChild(
//       node,
//       vNode => transformDescribesContextsAndIts(vNode, commandName, foundNockData),
//       nullTransformationContext,
//     )
//   }
//
//   /*
//   * Everything below is a bit awkward. We need to get nock info from beforeEach children in the describe/context
//   * and pass what we find into other children (siblings of beforeEach).
//   * We also need to flatten/hoist it() statements to parent describe/context statements to preserve anything defined there. These
//   * flattened statements will almost certainly be "wrong" in the output and will require dev effort to determine what to do with them.
//   *  */
//
//   // only pass found nock calls from beforeEach into children of describe/context
//   const newNockData = getNockCallsFromBeforeEach(node.arguments[1].body, foundNockData)
//   const newStatements: (ts.Statement | ts.Node)[] = []
//   for (const statement of node.arguments[1].body.statements) {
//     if (ts.isExpressionStatement(statement) && isTestItCall(statement.expression)) {
//       newStatements.push(
//         factory.createExpressionStatement(transformIts(statement.expression, newNockData, commandName)),
//         // move it() block statements up to parent describe/context
//         ...statement.expression.arguments[1].body.statements.filter(() => {
//           // todo: filter out expressions used for nock/command.run/etc
//           return true
//         }),
//       )
//     } else {
//       // recursively call transformDescribesContextsAndIts on statements directly
//       newStatements.push(transformDescribesContextsAndIts(statement, commandName, newNockData))
//     }
//   }
//
//   return factory.updateCallExpression(
//     node,
//     node.expression,
//     node.typeArguments,
//     [
//       node.arguments[0],
//       // second arg is a function or arrow function. We don't care and just want to update the body that has been confirmed to exist.
//       {
//         ...node.arguments[1],
//         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//         // @ts-ignore
//         body: factory.updateBlock(
//           node.arguments[1].body,
//           // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//           // @ts-ignore
//           newStatements,
//         ),
//       },
//     ],
//   )
// }

const createConsoleMockStart = (std: 'stdout' | 'stderr') => factory.createExpressionStatement(
  factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier(std),
      factory.createIdentifier('start'),
    ),
    undefined,
    [],
  ),
)

const createBeforeEachWithConsoleMock = (additionalStatements: ts.Statement[] = []) => factory.createExpressionStatement(
  factory.createCallExpression(
    factory.createIdentifier('beforeEach'),
    undefined,
    [
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createBlock(
          [
            ...additionalStatements,
            createConsoleMockStart('stdout'),
            createConsoleMockStart('stderr'),
          ],
          true,
        ),
      ),
    ],
  ),
)

const transformBeforeEach = (statement: BeforeEachCall): ts.ExpressionStatement => {
  let existingExpressions: ts.Statement[] = []
  // if function has a block, add to it, if not, get the call, wrap it in ExpressionStatement and added need expressions
  if (ts.isBlock(statement.expression.arguments[0].body)) {
    existingExpressions = [...statement.expression.arguments[0].body.statements]
  } else if (ts.isCallExpression(statement.expression.arguments[0].body)) {
    existingExpressions = [factory.createExpressionStatement(statement.expression.arguments[0].body)]
  } else {
    throw new Error('transformBeforeEach: unexpected pattern')
  }

  return createBeforeEachWithConsoleMock(existingExpressions)
}

const transformRuns = (node: ts.ExpressionStatement) => {
  const visitor = (vNode: ts.Node): ts.Node => {
    if (
      ts.isCallExpression(vNode) &&
      ts.isPropertyAccessExpression(vNode.expression) &&
      ts.isIdentifier(vNode.expression.name) &&
      vNode.expression.name.escapedText.toString() === 'run' &&
      ts.isObjectLiteralExpression(vNode.arguments[0])
    ) {
      const runArr = migrateCommandRun(vNode.arguments[0])

      return factory.createCallExpression(
        factory.createIdentifier('runCommand'),
        undefined,
        [
          factory.createIdentifier('Cmd'),
          factory.createArrayLiteralExpression(
            runArr,
            false,
          ),
        ],
      )
    }

    return ts.visitEachChild(vNode, visitor, nullTransformationContext)
  }

  return ts.visitEachChild(node, visitor, nullTransformationContext)
}

const transformRootDescribe = (statement: TestFunctionCall): ts.ExpressionStatement  => {
  let beforeEachFound = false
  let transformedStatements = [...statement.expression.arguments[1].body.statements]
    .map(describeBodyStatement => {
      if (isBeforeEachBlock(describeBodyStatement)) {
        beforeEachFound = true
        return transformBeforeEach(describeBodyStatement)
      }

      return describeBodyStatement
    })

  if (!beforeEachFound) {
    // add the beforeEach as first statement of describe
    transformedStatements = [createBeforeEachWithConsoleMock(), ...transformedStatements]
  }

  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createIdentifier('describe'),
      undefined,
      [
        statement.expression.arguments[0],
        factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createBlock(
            transformedStatements,
            true,
          ),
        ),
      ],
    ),
  )
}

export const transformTest = (sourceFile: ts.SourceFile) => {
  let describeFound = false
  const updatedStatements = [...sourceFile.statements]
    .map(statement => {
      if (isTestDescribeOrContextCall(statement)) {
      //   update source file with updated beforeEach, then run on everything else in the block
        describeFound = true
        return transformRootDescribe(statement)
      }

      return statement
    })
    .map(transformRuns)

  if (!describeFound) {
    throw new Error('no describe block found')
  }

  return factory.updateSourceFile(
    sourceFile,
    updatedStatements,
  )
}

export const migrateCommandRun = (runArgs: ts.ObjectLiteralExpression): ts.Expression[] => {
  const transformedCommand: ts.Expression[] = []
  // args handled separately because they sometimes need to be the last values added to .command(string[])
  const transformedArgs: ts.Expression[] = []
  for (const prop of runArgs.properties) {
    if (!ts.isIdentifier(prop.name)) {
      // this should never happen
      throw new Error('unexpected migrateCommandRun input')
    }

    const isShorthand = ts.isShorthandPropertyAssignment(prop)
    const isLongHand = ts.isPropertyAssignment(prop)

    if (!(isShorthand || isLongHand)) {
      continue
    }

    // check ShorthandPropertyAssignment vs PropertyAssignment
    switch (prop.name.escapedText.toString()) {
    case 'app': {
      if (isShorthand) {
        transformedCommand.push(factory.createStringLiteral('--app'), prop.name)
      } else {
        transformedCommand.push(factory.createStringLiteral('--app'), prop.initializer)
      }

      break
    }

    case 'flags': {
      if (isLongHand && ts.isObjectLiteralExpression(prop.initializer)) {
        for (const flagProp of prop.initializer.properties) {
          if (ts.isIdentifier(flagProp.name)) {
            transformedCommand.push(factory.createStringLiteral(`--${flagProp.name.escapedText.toString()}`))
            if (ts.isShorthandPropertyAssignment(flagProp)) {
              transformedCommand.push(flagProp.name)
            } else if (ts.isPropertyAssignment(flagProp)) {
              transformedCommand.push(flagProp.initializer)
            } else {
              console.error('deeply nested issue in migrateCommandRun')
            }
          }
        }
      } else {
        // todo: could spread and transform, but will be a nightmare to create via TS
        console.error('can not map command.run({flags})) short hand property assignment')
      }

      break
    }

    case 'args': {
      if (isLongHand && ts.isArrayLiteralExpression(prop.initializer)) {
        // it's already an array, just spread what is in there
        transformedArgs.push(...prop.initializer.elements)
      } else if (isShorthand) {
        transformedArgs.push(factory.createSpreadElement(prop.name))
      } else {
        // todo: could spread and transform, but will be a nightmare to create via TS
        console.error('can not map command.run({args})) short hand property assignment')
      }

      break
    }
    }
  }

  // args need to come last due to `static strict false` argv handling
  return [...transformedCommand, ...transformedArgs]
}
