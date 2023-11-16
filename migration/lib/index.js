import path from 'node:path'
import pascalcase from 'pascalcase'
import ts from 'typescript'
import {createClassElementsFromModuleExports} from './createClassElementFromModuleExports.js'
import {createCommandClass} from './createCommandClass.js'
import {isModuleExports} from './isModuleExports.js'
import {isRunFunctionDecl} from './isRunFunctionDecl.js'
import {nullTransformationContext} from './nullTransformationContext.js'
export class CommandMigrationFactory {
    program;
    printer;
    files;
    constructor(files, compilerOptions) {
      this.files = files
      this.program = ts.createProgram({rootNames: files, options: compilerOptions, host: ts.createCompilerHost(compilerOptions)})
      this.printer = ts.createPrinter({newLine: ts.NewLineKind.CarriageReturnLineFeed})
    }

    migrate() {
      this.files.forEach(file => {
        let ast = this.program.getSourceFile(file)
        ast = this.migrateRunFunctionDecl(ast, file)
        ast = this.migrateModuleExports(ast)
        ast = this.removeUnnededStatements(ast)
        const sourceFile = ts.createSourceFile(path.basename(file), '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
        // const sourceFile = ts.factory.createSourceFile(ast.statements, ts.factory.createToken(ts.SyntaxKind.EndOfFileToken), ts.NodeFlags.None);
        const nodeSrings = ast.statements.map(stmt => this.printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile))
        // const sourceFileString = this.printer.printNode(ts.EmitHint.Unspecified, ast.statements, sourceFile);
        debugger
      })
    }

    migrateRunFunctionDecl(node, filePath) {
      const visitor = node => {
        if (isRunFunctionDecl(node)) {
          const className = pascalcase(path.parse(filePath).name)
          return createCommandClass(node, ts.factory.createIdentifier(className))
        }

        return node
      }

      return ts.visitEachChild(node, visitor, nullTransformationContext)
    }

    migrateModuleExports(node) {
      const visitor = node => {
        if (isModuleExports(node)) {
          const classElementsFromModuleExports = createClassElementsFromModuleExports(node)
        }

        return ts.visitEachChild(node, visitor, nullTransformationContext)
      }

      return ts.visitEachChild(node, visitor, nullTransformationContext)
    }

    removeUnnededStatements(node) {
      const visitor = node => {
        if (ts.isStatement(node)) {
          return node
        }
      }

      return ts.visitEachChild(node, visitor, nullTransformationContext)
    }

    async writeSourceFile(content, originalFilePath) {}
}
// # sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQzVCLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQTtBQUNuQyxPQUFPLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFFM0IsT0FBTyxFQUFDLG9DQUFvQyxFQUFDLE1BQU0sMENBQTBDLENBQUE7QUFDN0YsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0seUJBQXlCLENBQUE7QUFDMUQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFBO0FBQ3BELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHdCQUF3QixDQUFBO0FBQ3hELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGdDQUFnQyxDQUFBO0FBRXhFLE1BQU0sT0FBTyx1QkFBdUI7SUFDYixPQUFPLENBQWE7SUFDcEIsT0FBTyxDQUFhO0lBQ3RCLEtBQUssQ0FBVztJQUVqQyxZQUFZLEtBQWUsRUFBRSxlQUFtQztRQUM5RCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsRUFBQyxDQUFDLENBQUE7UUFDM0gsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsc0JBQXNCLEVBQUMsQ0FBQyxDQUFBO0lBQ25GLENBQUM7SUFFTSxPQUFPO1FBQ1osSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDeEIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFD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
