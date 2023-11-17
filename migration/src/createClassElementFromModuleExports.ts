import ts from 'typescript'

const {
  factory,
  isObjectLiteralExpression,
  SyntaxKind,
} = ts

const isTrueValue = (node: ts.Node) => node.kind === SyntaxKind.TrueKeyword

const createStaticProperty = (name: string, value: ts.Expression) => factory.createPropertyDeclaration(
  [factory.createToken(SyntaxKind.StaticKeyword)],

  factory.createIdentifier(name),
  undefined,
  undefined,
  value,
)

// const propertyAssignmentToStatic = (node: (ts.PropertyAssignment & {name: ts.Identifier})) => createStaticProperty(node.name.escapedText, node.initializer)
const propertyAssignmentToStaticStringFunc = (name: string) => (
  (node: (ts.PropertyAssignment)) => createStaticProperty(name, node.initializer)
)

const createSpecialFlag = (type: string, required?: boolean) => () => createFlag({
  flagName: type,
  flagType: type,
  flagProperties: required ? [factory.createPropertyAssignment(
    factory.createIdentifier('required'),
    factory.createTrue(),
  )] : [],
})

const KEY_TO_TRANSFORM = new Map([
  ['topic', propertyAssignmentToStaticStringFunc('topic')],
  ['description', propertyAssignmentToStaticStringFunc('description')],
  ['hidden', propertyAssignmentToStaticStringFunc('hidden')],
  ['variableArgs', (node: (ts.PropertyAssignment)) => createStaticProperty('strict', node.initializer)],
])

const ADDITIONAL_KEY_TO_FLAG = new Map([
  ['needsApp', createSpecialFlag('app', true)],
  ['wantsApp', createSpecialFlag('app')],
  ['needsOrg', createSpecialFlag('team', true)],
  ['wantsOrg', createSpecialFlag('team')],
])

const createFlag = (args: {flagName: string, flagType: string, flagProperties: ts.PropertyAssignment[]}) => {
  const {flagName, flagType, flagProperties} = args
  const flagNameIdentifier = factory.createIdentifier(flagName)
  const flagTypeIdentifier = factory.createIdentifier(flagType)
  const objectLiteralExpressionInner = factory.createObjectLiteralExpression(flagProperties, true)

  // Create call expressions
  const propertyAccessExpression = factory.createPropertyAccessExpression(flagNameIdentifier, flagTypeIdentifier)
  const callExpression = factory.createCallExpression(propertyAccessExpression, undefined, [objectLiteralExpressionInner])

  // Create property assignment for the outer object
  return factory.createPropertyAssignment(flagTypeIdentifier, callExpression)
}

const transformFlag = (assignment: ts.ObjectLiteralExpression) => {
  // these all return true, just making TS happy
  let flagName = ''
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

const transformAllFlags = (additionalFlags: ts.PropertyAssignment[], existingFlags?: ts.PropertyAssignment) => {
  // to pluck out: name => key, hasValue => flag type
  let transformedFlags: ts.PropertyAssignment[] = []
  if (existingFlags) {
    if (!ts.isArrayLiteralExpression(existingFlags.initializer)) {
      throw new Error('flags is in incorrect format')
    }

    transformedFlags = existingFlags.initializer.elements
      .filter<ts.ObjectLiteralExpression>(isObjectLiteralExpression)
      .map(transformFlag)
  }

  const additionalTransformedFlags: ts.PropertyAssignment[] = []

  for (const element of additionalFlags) {
    //   element.name.escapedText

    if (ts.isPropertyAssignment(element) && ts.isIdentifier(element.name) && element.name.escapedText) {
      const transformer = ADDITIONAL_KEY_TO_FLAG.get(element.name.escapedText)
      if (transformer && isTrueValue(element.initializer)) {
        additionalTransformedFlags.push(transformer())
      }
    }
  }

  // Create the outer object literal expression
  const objectLiteralExpressionOuter = factory.createObjectLiteralExpression([...transformedFlags, ...additionalTransformedFlags])

  // Final call to createStaticProperty
  const createStaticPropertyCall = createStaticProperty('flags', objectLiteralExpressionOuter)

  return createStaticPropertyCall
}

export function createClassElementsFromModuleExports(node: ts.ObjectLiteralExpression): ts.ClassElement[] {
  const classElements: ts.ClassElement[] = []
  const additionalFlags: ts.PropertyAssignment[] = []
  let flagAssignment : ts.PropertyAssignment
  for (let i = 0; i < node.properties?.length; i++) {
    const element = node.properties[i]
    //   element.name.escapedText

    if (ts.isPropertyAssignment(element) && ts.isIdentifier(element.name) && element.name.escapedText) {
      const transformer = KEY_TO_TRANSFORM.get(element.name.escapedText)
      if (transformer) {
        classElements.push(transformer(element))
      } else if (ADDITIONAL_KEY_TO_FLAG.has(element.name.escapedText) && isTrueValue(element.initializer)) {
        additionalFlags.push(element)
      } else if (element.name.escapedText === 'flags') {
        flagAssignment = element
      }
    }
  }

  if (flagAssignment || additionalFlags.length > 0) {
    classElements.push(transformAllFlags(additionalFlags, flagAssignment))
  }

  return classElements
}
