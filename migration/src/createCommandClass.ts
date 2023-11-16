import ts from 'typescript'

export function createCommandClass(node: ts.FunctionDeclaration & { name: { text: 'run' }}, className: ts.Identifier | string) {
  // const classDecl = ts.factory.createClassDeclaration(undefined, className);
}
