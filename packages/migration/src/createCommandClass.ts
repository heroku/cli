import {createMethodDeclFromRunFn} from './createMethodDeclFromRunFn.js'
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
 * @returns ts.ClassDeclaration
 */
export function createCommandClass(runFunctionDecl: ts.FunctionDeclaration & { name: { text: 'run' }}, className: ts.Identifier): ts.ClassDeclaration {
  const heritageClause = ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier('Command'), [])])
  const member = createMethodDeclFromRunFn(runFunctionDecl, className)
  return ts.factory.createClassDeclaration([
    ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
    ts.factory.createModifier(ts.SyntaxKind.DefaultKeyword),
  ],
  className,
  undefined,
  [heritageClause],
  [member])
}
