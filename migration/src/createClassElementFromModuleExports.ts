import ts from 'typescript'

export function createClassElementsFromModuleExports(node: ts.ObjectLiteralExpression): ts.ClassElement[] {
  const classElements: ts.ClassElement[] = []
  for (let i = 0; i < node.properties?.length; i++) {
    const element = node.properties[i]
    // Inspect and convert in some way...
    //   element.name.escapedText
    // debugger
  }

  return classElements
}
