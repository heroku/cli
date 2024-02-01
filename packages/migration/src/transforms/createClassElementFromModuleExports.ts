import ts from 'typescript'

const {
  factory,
  isObjectLiteralExpression,
  SyntaxKind,
} = ts

const isTrueValue = (node: ts.Node) => node.kind === SyntaxKind.TrueKeyword

const createStaticPropertyDeclaration = (name: string, value: ts.Expression) => factory.createPropertyDeclaration(
  [factory.createToken(SyntaxKind.StaticKeyword)],
  factory.createIdentifier(name),
  undefined,
  undefined,
  value,
)

const createStaticPropertyDeclarationGenerator = (name: string) => (
  (node: (ts.PropertyAssignment)) => createStaticPropertyDeclaration(name, node.initializer)
)

const createSpecialFlagGenerator = (type: string, required?: boolean) => () => createFlag({
  flagName: type,
  flagType: type,
  flagProperties: required ? [factory.createPropertyAssignment(
    factory.createIdentifier('required'),
    factory.createTrue(),
  )] : [],
})

const KEY_TO_TRANSFORM = new Map([
  ['topic', createStaticPropertyDeclarationGenerator('topic')],
  ['usage', createStaticPropertyDeclarationGenerator('usage')],
  ['help', createStaticPropertyDeclarationGenerator('help')],
  ['description', createStaticPropertyDeclarationGenerator('description')],
  ['hidden', createStaticPropertyDeclarationGenerator('hidden')],
  ['variableArgs', (node: (ts.PropertyAssignment)) => {
    // `variableArgs: false` -> `static strict = true`
    if (isTrueValue(node.initializer)) {
      return createStaticPropertyDeclaration('strict', factory.createFalse())
    }
  }],
])

const ADDITIONAL_KEY_TO_FLAG = new Map([
  ['needsApp', createSpecialFlagGenerator('app', true)],
  ['wantsApp', createSpecialFlagGenerator('app')],
  ['needsOrg', createSpecialFlagGenerator('team', true)],
  ['wantsOrg', createSpecialFlagGenerator('team')],
])

const createFlag = (args: {flagName: string, flagType: string, flagProperties: ts.PropertyAssignment[]}) => {
  const {flagName, flagType, flagProperties} = args
  const flagNameIdentifier = factory.createStringLiteral(flagName)
  const flagTypeIdentifier = factory.createIdentifier(flagType)
  // ternary here to avoid empty objects: get flags.app() instead of flags.app({})
  const flagsObj = flagProperties.length > 0 ?
    [factory.createObjectLiteralExpression(flagProperties)] :
    undefined

  // Create call expressions: `flags.string()`
  const propertyAccessExpression = factory.createPropertyAccessExpression(factory.createIdentifier('flags'), flagTypeIdentifier)
  const callExpression = factory.createCallExpression(propertyAccessExpression, undefined, flagsObj)

  // Create property assignment for the outer object
  return factory.createPropertyAssignment(flagNameIdentifier, callExpression)
}

const createArg = (args: {argName: string, argProperties: ts.PropertyAssignment[]}) => {
  const {argName, argProperties} = args
  const flagNameIdentifier = factory.createStringLiteral(argName)
  // ternary here to avoid empty objects: get `Args.string()` instead of `Args.string({})`
  const argsObj = argProperties.length > 0 ?
    [factory.createObjectLiteralExpression(argProperties)] :
    undefined

  // Create call expressions
  const propertyAccessExpression = factory.createPropertyAccessExpression(
    factory.createIdentifier('Args'),
    factory.createIdentifier('string'), // Args.string() has worked for all cases so far, but??
  )
  const callExpression = factory.createCallExpression(propertyAccessExpression, undefined, argsObj)

  // Create property assignment for the outer object
  return factory.createPropertyAssignment(flagNameIdentifier, callExpression)
}

const transformFlag = (assignment: ts.ObjectLiteralExpression) => {
  let flagName = 'THIS_SHOULD_NOT_HAPPEN'
  let flagType = 'boolean'
  const flagProperties: ts.PropertyAssignment[] = []

  assignment.properties.forEach(element => {
    if (ts.isPropertyAssignment(element) && ts.isIdentifier(element.name) && element.name.escapedText) {
      const key = element.name.escapedText
      switch (key) {
      case 'name':
        if (ts.isStringLiteral(element.initializer)) {
          flagName = element.initializer.text
        } else {
          throw new Error('flag name property is not a string')
        }

        break
      case 'hasValue':
        if (isTrueValue(element.initializer)) {
          flagType = 'string'
        }

        break
      default:
        // pass through without transforming
        flagProperties.push(element)
      }
    }
  })

  return createFlag({flagName, flagType, flagProperties})
}

const transformAllFlags = (specialFlags: ts.PropertyAssignment[], existingFlags?: ts.PropertyAssignment) => {
  let transformedFlags: ts.PropertyAssignment[] = []
  if (existingFlags) {
    if (!ts.isArrayLiteralExpression(existingFlags.initializer)) {
      throw new Error('flags are in incorrect format')
    }

    transformedFlags = existingFlags.initializer.elements
      // filter here is to simplify type checking downstream, but may have unintended consequences
      .filter<ts.ObjectLiteralExpression>(isObjectLiteralExpression)
      .map(transformFlag)
  }

  const additionalTransformedFlags: ts.PropertyAssignment[] = []

  // move module.exports non-flag properties to flags. ex: wantsApp, needsOrg, etc
  specialFlags.forEach(element => {
    if (ts.isPropertyAssignment(element) && ts.isIdentifier(element.name) && element.name.escapedText) {
      const transformer = ADDITIONAL_KEY_TO_FLAG.get(element.name.escapedText)
      if (transformer && isTrueValue(element.initializer)) {
        additionalTransformedFlags.push(transformer())
      }
    }
  })

  // Create the outer object literal expression
  const objectLiteralExpressionOuter = factory.createObjectLiteralExpression(
    [...transformedFlags, ...additionalTransformedFlags],
    true,
  )

  // Final call to createStaticProperty
  return createStaticPropertyDeclaration('flags', objectLiteralExpressionOuter)
}

const transformArg = (assignment: ts.ObjectLiteralExpression) => {
  let argName = 'THIS_SHOULD_NOT_HAPPEN'
  const argProperties: ts.PropertyAssignment[] = []
  let required = true

  assignment.properties.forEach(element => {
    if (ts.isPropertyAssignment(element) && ts.isIdentifier(element.name) && element.name.escapedText) {
      const key = element.name.escapedText
      switch (key) {
      case 'name':
        if (ts.isStringLiteral(element.initializer)) {
          argName = element.initializer.text
        } else {
          throw new Error('arg name property is not a string')
        }

        break
      case 'optional':
        if (isTrueValue(element.initializer)) {
          required = false
        }

        break
      default:
        // pass through without transforming
        argProperties.push(element)
      }
    }
  })

  if (required) {
    argProperties.push(factory.createPropertyAssignment(
      factory.createIdentifier('required'),
      factory.createTrue(),
    ))
  }

  return createArg({argName: argName, argProperties})
}

const transformAllArgs = (existingArgs: ts.PropertyAssignment) => {
  let transformedArgs: ts.PropertyAssignment[] = []
  if (existingArgs) {
    if (!ts.isArrayLiteralExpression(existingArgs.initializer)) {
      throw new Error('args are in incorrect format')
    }

    transformedArgs = existingArgs.initializer.elements
      // filter here is to simplify type checking downstream, but may have unintended consequences
      .filter<ts.ObjectLiteralExpression>(isObjectLiteralExpression)
      .map(transformArg)
  }

  // Create the outer object literal expression
  const objectLiteralExpressionOuter = factory.createObjectLiteralExpression(transformedArgs, true)

  // Final call to createStaticProperty
  return createStaticPropertyDeclaration('args', objectLiteralExpressionOuter)
}

export function createClassElementsFromModuleExports(node: ts.ObjectLiteralExpression): ts.PropertyDeclaration[] {
  const classElements: ts.PropertyDeclaration[] = []
  const additionalFlags: ts.PropertyAssignment[] = []
  let flagsAssignment : ts.PropertyAssignment
  let argsAssignment : ts.PropertyAssignment
  node.properties.forEach(element => {
    // todo: turn `if` below into function that verifies the type for all downstream function calls
    if (ts.isPropertyAssignment(element) && ts.isIdentifier(element.name) && element.name.escapedText) {
      const transformer = KEY_TO_TRANSFORM.get(element.name.escapedText)
      if (transformer) {
        classElements.push(transformer(element))
      } else if (ADDITIONAL_KEY_TO_FLAG.has(element.name.escapedText) && isTrueValue(element.initializer)) {
        additionalFlags.push(element)
      } else if (element.name.escapedText === 'args') {
        argsAssignment = element
      }  else if (element.name.escapedText === 'flags') {
        flagsAssignment = element
      }
    }
  })

  if (flagsAssignment || additionalFlags.length > 0) {
    classElements.push(transformAllFlags(additionalFlags, flagsAssignment))
  }

  if (argsAssignment) {
    classElements.push(transformAllArgs(argsAssignment))
  }

  return classElements
}
