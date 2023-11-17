import path from 'node:path'
import fs from 'node:fs/promises'
import pascalcase from 'pascalcase'
import ts from 'typescript'
import {ESLint} from 'eslint'

import {createClassElementsFromModuleExports} from './createClassElementFromModuleExports.js'
import {createCommandClass} from './createCommandClass.js'
import {isExtendedCommandClassDeclaration, isModuleExports} from './isModuleExports.js'
import {isRunFunctionDecl} from './isRunFunctionDecl.js'
import {nullTransformationContext} from './nullTransformationContext.js'
import {isMigrationCandidate} from './isMigrationCandidate.js'

const commonImports = `import {createRequire} from 'node:module'
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

const require = createRequire(import.meta.url)
`
export class CommandMigrationFactory {
    private static outputLocation = 'converted' as const

    protected readonly program: ts.Program;
    protected readonly printer: ts.Printer;
    protected readonly linter: ESLint
    private readonly files: string[];

    constructor(files: string[], compilerOptions: ts.CompilerOptions) {
      this.files = files
      this.program = ts.createProgram({rootNames: files, options: compilerOptions, host: ts.createCompilerHost(compilerOptions)})
      this.printer = ts.createPrinter({newLine: ts.NewLineKind.CarriageReturnLineFeed})
      this.linter = new ESLint({fix: true})
    }

    public async migrate(): Promise<void> {
      const lintOperations: Promise<ESLint.LintResult[]>[] = []
      for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i]
        let ast = this.program.getSourceFile(file)
        if (!isMigrationCandidate(ast)) {
          continue
        }

        ast = this.migrateRunFunctionDecl(ast, file)
        ast = this.migrateModuleExports(ast)
        ast = this.updateOrRemoveStatements(ast)
        const sourceFile = ts.createSourceFile(path.basename(file), '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
        const sourceStr = commonImports + this.printer.printList(ts.ListFormat.MultiLine, ast.statements, sourceFile)

        lintOperations.push(this.linter.lintText(sourceStr, {filePath: file}))
      }

      const lintResults = await Promise.all(lintOperations)
      await Promise.all(lintResults.map(res => this.writeSourceFile(res[0].output, res[0].filePath)))
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

    private migrateModuleExports(sourceFile: ts.SourceFile): ts.SourceFile {
      let staticClassMembers: ts.PropertyDeclaration[]
      const visitor = (node: ts.Node): ts.Node => {
        if (isModuleExports(node)) {
          staticClassMembers = createClassElementsFromModuleExports(node.right)
          // remove module.exports from node???
        }

        return ts.visitEachChild(node, visitor, nullTransformationContext)
      }

      sourceFile = ts.visitEachChild(sourceFile, visitor, nullTransformationContext)

      if (staticClassMembers) {
        const updateClassDef = (node: ts.Node): ts.Node => {
          if (isExtendedCommandClassDeclaration(node)) {
            return ts.factory.updateClassDeclaration(
              node,
              node.modifiers,
              node.name,
              node.typeParameters,
              node.heritageClauses,
              [...node.members, ...staticClassMembers],
            )
          }

          return ts.visitEachChild(node, updateClassDef, nullTransformationContext)
        }

        return ts.visitEachChild(sourceFile, updateClassDef, nullTransformationContext)
      }
    }

    private updateOrRemoveStatements(node: ts.SourceFile) : ts.SourceFile {
      const visitor = (node: ts.Node): ts.Node => {
        // 'use strict'
        if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === 'use strict') {
          return null
        }

        // module.exports
        if (ts.isExpressionStatement(node) && isModuleExports(node.expression)) {
          return null
        }

        // some string literals that are no longer aligned with
        // the original source file do not print properly
        // recreating them seems to workaround this issue.
        if (ts.isStringLiteral(node)) {
          return ts.factory.createStringLiteral(node.text)
        }

        return ts.visitEachChild(node, visitor, nullTransformationContext)
      }

      return ts.visitEachChild(node, visitor, nullTransformationContext)
    }

    private async writeSourceFile(content: string, originalFilePath: string): Promise<void> {
      const {dir, name} = path.parse(originalFilePath)
      const pathFromRoot = dir.replace(process.cwd(), '')
      const finalPath = path.join(path.resolve(CommandMigrationFactory.outputLocation), pathFromRoot)

      await fs.mkdir(finalPath, {recursive: true})
      await fs.writeFile(path.join(finalPath, `${pascalcase(name)}.ts`), content)
    }
}
