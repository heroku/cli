import ts from 'typescript';

export function isRunFunctionDecl(node: ts.Node): node is ts.FunctionDeclaration & {name: {text: 'run'}}{
    return ts.isFunctionDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'run';
}
