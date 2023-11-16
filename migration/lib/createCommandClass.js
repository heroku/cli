import { createMethodDeclFromRunFn } from './createMethodDeclFromRunFn.js';
import ts from 'typescript';
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
export function createCommandClass(runFunctionDecl, className) {
    const heritageClause = ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier('Command'), [])]);
    const member = createMethodDeclFromRunFn(runFunctionDecl, className);
    return ts.factory.createClassDeclaration([
        ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
        ts.factory.createModifier(ts.SyntaxKind.DefaultKeyword),
    ], className, undefined, [heritageClause], [member]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlQ29tbWFuZENsYXNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NyZWF0ZUNvbW1hbmRDbGFzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQTtBQUN4RSxPQUFPLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFFM0I7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsZUFBa0UsRUFBRSxTQUF3QjtJQUM3SCxNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNoTCxNQUFNLE1BQU0sR0FBRyx5QkFBeUIsQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUE7SUFDcEUsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDO1FBQ3ZDLEVBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO1FBQ3RELEVBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDO0tBQ3hELEVBQ0QsU0FBUyxFQUNULFNBQVMsRUFDVCxDQUFDLGNBQWMsQ0FBQyxFQUNoQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7QUFDWCxDQUFDIn0=