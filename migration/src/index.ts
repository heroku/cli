import path from 'node:path'
import pascalcase from 'pascalcase'
import ts from 'typescript'

import {createClassElementsFromModuleExports} from './createClassElementFromModuleExports.js'
import {createCommandClass} from './createCommandClass.js'
import {isModuleExports} from './isModuleExports.js'
import {isRunFunctionDecl} from './isRunFunctionDecl.js'
import {nullTransformationContext} from './nullTransformationContext.js'

export class CommandMigrationFactory {
    protected readonly program: ts.Program;
    protected readonly printer: ts.Printer;
    private readonly files: string[];

    constructor(files: string[], compilerOptions: ts.CompilerOptions) {
      this.files = files
      this.program = ts.createProgram({rootNames: files, options: compilerOptions, host: ts.createCompilerHost(compilerOptions)})
      this.printer = ts.createPrinter({newLine: ts.NewLineKind.CarriageReturnLineFeed})
    }

    public migrate(): void {
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

    private migrateRunFunctionDecl(node: ts.SourceFile, filePath: string): ts.SourceFile {
      const visitor = (node: ts.Node): ts.Node => {
        if (isRunFunctionDecl(node)) {
          const className = pascalcase(path.parse(filePath).name)
          return createCommandClass(node, ts.factory.createIdentifier(className))
        }

        return node
      }

      return ts.visitEachChild(node, visitor, nullTransformationContext)
    }

    private migrateModuleExports(node: ts.SourceFile): ts.SourceFile {
      const visitor = (node: ts.Node): ts.Node => {
        if (isModuleExports(node)) {
          const classElementsFromModuleExports = createClassElementsFromModuleExports(node)
        }

        return ts.visitEachChild(node, visitor, nullTransformationContext)
      }

      return ts.visitEachChild(node, visitor, nullTransformationContext)
    }

    private removeUnnededStatements(node: ts.SourceFile) : ts.SourceFile {
      const visitor = (node: ts.Node): ts.Node => {
        if (ts.isStatement(node)) {
          return node
        }
      }

      return ts.visitEachChild(node, visitor, nullTransformationContext)
    }

    private async writeSourceFile(content: string, originalFilePath: string): Promise<void> {}
}
