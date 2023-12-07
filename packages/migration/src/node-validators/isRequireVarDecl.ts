import ts from 'typescript'

export function isRequireVarDecl(node: ts.Node): node is ts.VariableDeclarationList {
  return ts.isVariableDeclarationList(node) &&
    ts.isVariableDeclaration(node.declarations[0]) &&
        ts.isCallExpression(node.declarations[0].initializer) &&
        ts.isIdentifier(node.declarations[0].initializer.expression) &&
        node.declarations[0].initializer.expression.text === 'require'
}
