import ts, {factory} from 'typescript'

const createStaticProperty = (name: string, value: ts.Expression) => ts.factory.createPropertyDeclaration(
  [ts.factory.createToken(ts.SyntaxKind.StaticKeyword)],
  ts.factory.createIdentifier(name),
  undefined,
  undefined,
  value,
)

// const propertyAssignmentToStatic = (node: (ts.PropertyAssignment & {name: ts.Identifier})) => createStaticProperty(node.name.escapedText, node.initializer)
const propertyAssignmentToStaticStringFunc = (name: string) => (
  (node: (ts.PropertyAssignment)) => createStaticProperty(name, node.initializer)
)

const KEY_TO_TRANSFORM = new Map([
  ['topic', propertyAssignmentToStaticStringFunc('topic')],
  ['description', propertyAssignmentToStaticStringFunc('description')],
  ['hidden', propertyAssignmentToStaticStringFunc('hidden')],
  ['variableArgs', (node: (ts.PropertyAssignment)) => createStaticProperty('strict', node.initializer)],
])

const FLAG_KEY_TO_TRANSFORM = new Map([
  ['topic', propertyAssignmentToStaticStringFunc('topic')],
  ['description', propertyAssignmentToStaticStringFunc('description')],
  ['hidden', propertyAssignmentToStaticStringFunc('hidden')],
  ['variableArgs', (node: (ts.PropertyAssignment)) => createStaticProperty('strict', node.initializer)],
])

const ADDITIONAL_KEY_TO_TRANSFORM_TO_FLAG = new Map([
  ['needsApp', true], // todo: add transformers
  ['wantsApp', true],
  ['needsOrg', true],
  ['wantsOrg', true],
])

const createFlagPropertyAssignment = (assignment: ts.ObjectLiteralExpression) => {
  const nameAssignment = assignment.properties.find(prop => prop.name.escapedText === 'name')

  // Create identifiers
  const flagsIdentifier = factory.createIdentifier('flags')
  const flatTypeIdentifier = factory.createIdentifier(nameAssignment.escapedText)
  const descriptionIdentifier = factory.createIdentifier('description')
  const requiredIdentifier = factory.createIdentifier('required')

  // Create literals
  const descriptionStringLiteral = factory.createStringLiteral('parent app used by review apps')
  const trueLiteral = factory.createTrue()

  // Create property assignments
  const descriptionPropertyAssignment = factory.createPropertyAssignment(descriptionIdentifier, descriptionStringLiteral)
  const requiredPropertyAssignment = factory.createPropertyAssignment(requiredIdentifier, trueLiteral)

  // Create object literal expressions
  const objectLiteralExpressionInner = factory.createObjectLiteralExpression([descriptionPropertyAssignment, requiredPropertyAssignment], false)

  // Create call expressions
  const propertyAccessExpression = factory.createPropertyAccessExpression(flagsIdentifier, flatTypeIdentifier)
  const callExpression = factory.createCallExpression(propertyAccessExpression, undefined, [objectLiteralExpressionInner])

  // Create property assignment for the outer object
  const appPropertyAssignment = factory.createPropertyAssignment(flatTypeIdentifier, callExpression)
  return appPropertyAssignment
}

const transformAllFlags = (additionalFlags: ts.PropertyAssignment[], existingFlags?: ts.ObjectLiteralExpression[]) => {
  // to pluck out: name => key, hasValue => flag type

  const transformedFlags = existingFlags.map(element => createFlagPropertyAssignment(element))

  // Create the outer object literal expression
  const objectLiteralExpressionOuter = factory.createObjectLiteralExpression(transformedFlags)

  // Final call to createStaticProperty
  const createStaticPropertyCall = createStaticProperty('flags', objectLiteralExpressionOuter)

  return createStaticPropertyCall
}

export function createClassElementsFromModuleExports(node: ts.ObjectLiteralExpression): ts.ClassElement[] {
  const classElements: ts.ClassElement[] = []
  const additionalFlags: ts.PropertyAssignment[] = []
  let flagsIndex = -1
  for (let i = 0; i < node.properties?.length; i++) {
    const element = node.properties[i]
    //   element.name.escapedText

    if (ts.isPropertyAssignment(element) && ts.isIdentifier(element.name) && element.name.escapedText) {
      const transformer = KEY_TO_TRANSFORM.get(element.name.escapedText)
      if (transformer) {
        classElements.push(transformer(element))
      } else if (ADDITIONAL_KEY_TO_TRANSFORM_TO_FLAG.has(element.name.escapedText)) {
        additionalFlags.push(element)
      } else if (element.name.escapedText === 'flags') {
        flagsIndex = i
      }
    }
  }

  if (flagsIndex >= 0 || additionalFlags.length > 0) {
    const flagAssignment = node.properties[flagsIndex]
    const flagElements: ts.ObjectLiteralExpression[] = (
      flagAssignment &&
      ts.isPropertyAssignment(flagAssignment) &&
      ts.isArrayLiteralExpression(flagAssignment.initializer) &&
      flagAssignment.initializer.elements.map(ts.isObjectLiteralExpression).every(Boolean)
    ) ?
      new Array(flagAssignment.initializer.elements) :
      []

    classElements.push(transformAllFlags(additionalFlags, flagElements))
  }

  return classElements
}
