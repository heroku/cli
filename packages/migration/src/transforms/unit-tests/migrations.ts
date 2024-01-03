import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'
import {
  BeforeEachCall,
  isBeforeEachBlock,
  isTestDescribeOrContextCall,
  TestFunctionCall,
} from './validators.js'

const {factory} = ts

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
            true,
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
      if (!isLongHand || !ts.isObjectLiteralExpression(prop.initializer)) {
        // todo: could spread and transform, but will be a nightmare to create via TS
        console.error('can not transform command.run({flags})) short hand property assignment')
        break
      }

      for (const flagProp of prop.initializer.properties) {
        if (!ts.isIdentifier(flagProp.name)) {
          continue
        }

        if (ts.isShorthandPropertyAssignment(flagProp)) {
          transformedCommand.push(factory.createStringLiteral(`--${flagProp.name.escapedText.toString()}`), flagProp.name)
        } else if (ts.isPropertyAssignment(flagProp)) {
          if (flagProp.initializer.kind === ts.SyntaxKind.FalseKeyword) {
            // filter out args when value false.
            break
          }

          transformedCommand.push(factory.createStringLiteral(`--${flagProp.name.escapedText.toString()}`))
          if (flagProp.initializer.kind !== ts.SyntaxKind.TrueKeyword) {
            transformedCommand.push(flagProp.initializer)
          }
        } else {
          console.error('deeply nested issue in migrateCommandRun')
        }
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
