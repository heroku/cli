import ts from 'typescript'

/**
 * Creates a class with the specified name which extends the Command base class
 * and which contains a 'run' method declaration.
 * e.g.
 * ```
 * class MyClass extends Command {
 *   public async run(): Promise<void> {
 *     // body of run function decl
 *   }
 * }
 * ```
 * @param runFunctionDecl The 'run' function declaration found using isRunFunctionDec
 * @param className The name of the class to create
 */
export function createCommandClass(runFunctionDecl: ts.FunctionDeclaration & { name: { text: 'run' }}, className: ts.Identifier | string): ts.ClassDeclaration {
  const heritageClause = ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier('Command'))])
  const member = ts.factory.createMethodDeclaration([ts.factory.createModifier(ts.SyntaxKind.PublicKeyword), ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
    undefined,
    runFunctionDecl.name.text,
    undefined,
    undefined,
    undefined,
    ts.factory.createTypeReferenceNode('Promise', [ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)]),
    runFunctionDecl.body)
  return ts.factory.createClassDeclaration(undefined, className, undefined, [heritageClause], [member])
}
