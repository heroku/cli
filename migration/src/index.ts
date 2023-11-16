import path from 'node:path'
import pascalcase from 'pascalcase'
import ts from 'typescript'

import {createClassElementsFromModuleExports} from './createClassElementFromModuleExports.js'
import {createCommandClass} from './createCommandClass.js'
import {isModuleExports} from './isModuleExports.js'
import {isRunFunctionDecl} from './isRunFunctionDecl.js'
import {nullTransformationContext} from './nullTransformationContext.js'
import {isMigrationCandidate} from './isMigrationCandidate.js'

const commonImports = `import {createRequire} from 'node:module'
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

const require = createRequire(imports.meta.url)
`
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
      for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i]
        let ast = this.program.getSourceFile(file)
        if (!isMigrationCandidate(ast)) {
          continue
        }

        ast = this.migrateRunFunctionDecl(ast, file)
        ast = this.migrateModuleExports(ast)
        ast = this.removeUnnededStatements(ast)
        const sourceFile = ts.createSourceFile(path.basename(file), '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
        const nodeStrings = commonImports + ast.statements.map(stmt => this.printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile))
        this.writeSourceFile(nodeStrings, file)
      }
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
          const classElementsFromModuleExports = createClassElementsFromModuleExports(node.right)
        }

        return ts.visitEachChild(node, visitor, nullTransformationContext)
      }

      return ts.visitEachChild(node, visitor, nullTransformationContext)
    }

    private removeUnnededStatements(node: ts.SourceFile) : ts.SourceFile {
      const visitor = (node: ts.Node): ts.Node => {
        // 'use strict'
        if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === 'use strict') {
          return null
        }

        // module.exports
        if (ts.isExpressionStatement(node) && isModuleExports(node.expression)) {
          return null
        }

        return ts.visitEachChild(node, visitor, nullTransformationContext)
      }

      return ts.visitEachChild(node, visitor, nullTransformationContext)
    }

    private async writeSourceFile(content: string, originalFilePath: string): Promise<void> {}
}
