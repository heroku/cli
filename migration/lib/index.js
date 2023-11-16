import path from 'node:path'
import pascalcase from 'pascalcase'
import ts from 'typescript'
import {createClassElementsFromModuleExports} from './createClassElementFromModuleExports.js'
import {createCommandClass} from './createCommandClass.js'
import {isModuleExports} from './isModuleExports.js'
import {isRunFunctionDecl} from './isRunFunctionDecl.js'
import {nullTransformationContext} from './nullTransformationContext.js'
import {isRequireVarDecl} from './isRequireVarDecl.js'
import {isMigrationCandidate} from './isMigrationCandidate.js'
const commonImports = `import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
`
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
      for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i]
        const ast = this.program.getSourceFile(file)
        if (!isMigrationCandidate(ast)) {
          continue
        }
      }

      this.files.forEach(file => {
        let ast = this.program.getSourceFile(file)
        ast = this.migrateRunFunctionDecl(ast, file)
        ast = this.migrateModuleExports(ast)
        ast = this.removeUnnededStatements(ast)
        const sourceFile = ts.createSourceFile(path.basename(file), '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
        const nodeStrings = commonImports + ast.statements.map(stmt => this.printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile))
        this.writeSourceFile(nodeStrings, file)
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
        // 'use strict'
        if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === 'use strict') {
          return null
        }

        // const myConst = require('somePackage')
        if (ts.isVariableStatement(node) && isRequireVarDecl(node.declarationList)) {
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

    async writeSourceFile(content, originalFilePath) {}
}
// # sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQzVCLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQTtBQUNuQyxPQUFPLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFFM0IsT0FBTyxFQUFDLG9DQUFvQyxFQUFDLE1BQU0sMENBQTBDLENBQUE7QUFDN0YsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0seUJBQXlCLENBQUE7QUFDMUQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFBO0FBQ3BELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHdCQUF3QixDQUFBO0FBQ3hELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGdDQUFnQyxDQUFBO0FBQ3hFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHVCQUF1QixDQUFBO0FBQ3RELE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLDJCQUEyQixDQUFBO0FBRTlELE1BQU0sYUFBYSxHQUFHOzs7O0NBSXJCLENBQUE7QUFDRCxNQUFNLE9BQU8sdUJBQXVCO0lBQ2IsT0FBTyxDQUFhO0lBQ3BCLE9BQU8sQ0FBYTtJQUN0QixLQUFLLENBQVc7SUFFakMsWUFBWSxLQUFlLEVBQUUsZUFBbUM7UUFDOUQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7UUFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLEVBQUMsQ0FBQyxDQUFBO1FBQzNILElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFD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
