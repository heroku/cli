import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext.js'

const {factory} = ts

export const transformRuns = (node: ts.ExpressionStatement) => {
  const visitor = (vNode: ts.Node): ts.Node => {
    if (
      ts.isCallExpression(vNode) &&
      ts.isPropertyAccessExpression(vNode.expression) &&
      ts.isIdentifier(vNode.expression.name) &&
      vNode.expression.name.escapedText.toString() === 'run' &&
      vNode.arguments[0] &&
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

    const keyName = prop.name.escapedText.toString()
    switch (keyName) {
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
        console.error('can not transform command.run({flags})) shorthand property assignment')
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
      }  else if (ts.isObjectLiteralExpression(prop.initializer)) {
        for (const argProp of prop.initializer.properties) {
          if (!ts.isIdentifier(argProp.name)) {
            continue
          }

          if (ts.isShorthandPropertyAssignment(argProp)) {
            transformedArgs.push(argProp.name)
          } else if (ts.isPropertyAssignment(argProp)) {
            transformedArgs.push(argProp.initializer)
          }
        }
      } else {
        console.error('can not map command.run({args}))')
      }

      break
    }

    default:
      break
    }
  }

  // args need to come last due to `static strict false` argv handling
  return [...transformedCommand, ...transformedArgs]
}
