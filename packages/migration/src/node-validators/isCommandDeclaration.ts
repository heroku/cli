import ts from 'typescript'

type CommandDeclaration = ts.VariableStatement & {
  declarationList: ts.VariableDeclarationList & {
    declarations: (ts.Declaration & {
      initializer: ts.ObjectLiteralExpression
    })[]
  }
}

/**
 * Determines if the specified node has this shape:
 * var/let/const anyName = {
 *   ...*
 *   run: *
 * }
 *
 * Intended to be run at the root level of file on ts.SourceFile['statements']
 * @param node The node to evaluate
 * @returns boolean if the node matches pattern
 */
export const isCommandDeclaration = (node: ts.Node): node is CommandDeclaration => {
  if (
    ts.isVariableStatement(node) &&
    // only look at first declaration. Ignore multiple declarations cases like:
    // let a, b, c, d;
    node.declarationList.declarations[0]?.initializer &&
    ts.isObjectLiteralExpression(node.declarationList.declarations[0].initializer)
  ) {
    for (const prop of  node.declarationList.declarations[0].initializer.properties) {
      if (ts.isIdentifier(prop.name) && prop.name.escapedText === 'run') {
        return true
      }
    }
  }

  return false
}
