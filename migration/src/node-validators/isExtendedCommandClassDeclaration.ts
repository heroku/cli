import ts from 'typescript'

/**
 * Determines if the specified node is a 'class NAME extends Command' expression.
 *
 * @param node The node to evaluate
 * @returns boolean if the node is extended Command
 */
export const isExtendedCommandClassDeclaration = (node: ts.Node): node is ts.ClassDeclaration => {
  return ts.isClassDeclaration(node) &&
    node.heritageClauses.some(
      clause => clause.types.some(type => (
        ts.isIdentifier(type.expression) && type.expression.escapedText === 'Command'),
      ),
    )
}
