import {createRequire} from 'node:module'
import path from 'node:path'
import fs from 'node:fs/promises'
import {stdout} from 'node:process'
import pascalcase from 'pascalcase'
import ts from 'typescript'
import {ESLint} from 'eslint'

import {createClassElementsFromModuleExports} from './transforms/createClassElementFromModuleExports.js'
import {createCommandClass} from './createCommandClass.js'
import {isModuleExportsObject} from './node-validators/isModuleExportsObject.js'
import {isRunFunctionDecl} from './node-validators/isRunFunctionDecl.js'
import {nullTransformationContext} from './nullTransformationContext.js'
import {isCommandMigrationCandidate} from './node-validators/isCommandMigrationCandidate.js'
import {isExtendedCommandClassDeclaration} from './node-validators/isExtendedCommandClassDeclaration.js'
import {isModuleExportsArray} from './node-validators/isModuleExportsArray.js'
import {getCommandDeclaration} from './getCommandDeclaration.js'
import {isCommandDeclaration} from './node-validators/isCommandDeclaration.js'
import transformCliUtils from './transforms/heroku-cli-utils/transformCliUtils.js'
import {findRequiredPackageVarNameIfExits} from './findRequiredPackageVarNameIfExits.js'
import {migrateTestFile} from './transforms/unit-tests/index.js'

const require = createRequire(import.meta.url)

abstract class MigrationFactoryBase {
  protected outputLocation: string;
  protected readonly program: ts.Program;
  protected readonly printer: ts.Printer;
  protected readonly linter: ESLint
  protected readonly files: string[];
  protected allowOverwrite = false;
  protected commonImports: string

  constructor(files: string[], compilerOptions: ts.CompilerOptions, outDir?: string, allowOverwrite?: boolean) {
    this.files = files
    this.program = ts.createProgram({rootNames: files, options: compilerOptions, host: ts.createCompilerHost(compilerOptions, true)})
    this.printer = ts.createPrinter({newLine: ts.NewLineKind.CarriageReturnLineFeed})
    this.linter = new ESLint({fix: true, overrideConfigFile: './packages/migration/.eslintrc'})
    if (outDir) {
      this.outputLocation = outDir
    }

    if (allowOverwrite) {
      this.allowOverwrite = true
    }
  }

  abstract migrate(): Promise<void>;

  abstract writeSourceFile(content: string, originalFilePath: string): Promise<void>;

  updateOrRemoveStatements(node: ts.SourceFile, isTest = false) : ts.SourceFile {
    const visitor = (node: ts.Node): ts.Node => {
      // 'use strict'
      if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === 'use strict') {
        return null
      }

      // module.exports
      const isModuleExports = ts.isExpressionStatement(node) && (isModuleExportsObject(node.expression) || isModuleExportsArray(node.expression))
      if (isModuleExports || (!isTest && isCommandDeclaration(node))) {
        return null
      }

      // some string literals that are no longer aligned with
      // the original source file do not print properly
      // recreating them seems to work around this issue.
      if (ts.isStringLiteral(node)) {
        return ts.factory.createStringLiteral(node.text)
      }

      // some number literals that are no longer aligned with
      // the original source file do not print properly
      // recreating them seems to work around this issue.
      if (ts.isNumericLiteral(node)) {
        return ts.factory.createNumericLiteral(node.text)
      }

      // some RegularExpressionLiteral that are no longer aligned with
      // the original source file do not print properly
      // recreating them seems to work around this issue.
      if (ts.isRegularExpressionLiteral(node)) {
        return ts.factory.createRegularExpressionLiteral(node.text)
      }

      // some Template strings that are no longer aligned with
      // the original source file do not print properly
      // recreating them seems to work around this issue.
      // replace all parts
      if (ts.isNoSubstitutionTemplateLiteral(node)) {
        return ts.factory.createNoSubstitutionTemplateLiteral(node.text)
      }

      if (ts.isTemplateHead(node)) {
        return ts.factory.createTemplateHead(node.text)
      }

      if (ts.isTemplateMiddle(node)) {
        return ts.factory.createTemplateMiddle(node.text)
      }

      if (ts.isTemplateTail(node)) {
        return ts.factory.createTemplateTail(node.text)
      }

      return ts.visitEachChild(node, visitor, nullTransformationContext)
    }

    return ts.visitEachChild(node, visitor, nullTransformationContext)
  }
}

export class CommandMigrationFactory extends MigrationFactoryBase {
  protected readonly outputLocation: string = path.join('packages', 'cli', 'src')
  commonImports = `import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

`

  constructor(files: string[], compilerOptions: ts.CompilerOptions, outDir?: string, allowOverwrite?: boolean) {
    super(files, compilerOptions, outDir, allowOverwrite)
    if (outDir) {
      this.outputLocation = outDir
    }

    if (allowOverwrite) {
      this.allowOverwrite = true
    }
  }

  public async migrate(): Promise<void> {
    const lintOperations: Promise<ESLint.LintResult[]>[] = []
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i]
      let ast = this.program.getSourceFile(file)

      try {
        if (!isCommandMigrationCandidate(ast)) {
          continue
        }

        ast = this.migrateRunFunctionDecl(ast, file)
        ast = this.migrateCommandDeclaration(ast, file)
        ast = this.migrateHerokuCliUtilsExports(ast, file)
        ast = this.updateOrRemoveStatements(ast)
        const sourceFile = ts.createSourceFile(path.basename(file), '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
        const sourceStr = this.commonImports + this.printer.printList(ts.ListFormat.MultiLine, ast.statements, sourceFile)

        lintOperations.push(this.linter.lintText(sourceStr, {filePath: file}))
      } catch (error: any) {
        console.error(`error file: ${file}`)
        throw error
      }
    }

    const lintResults = await Promise.all(lintOperations)
    await Promise.all(lintResults.map(res => this.writeSourceFile(res[0].output, res[0].filePath)))
    stdout.write(`Migrated ${lintResults.length} commands.\n`)
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

  private migrateCommandDeclaration(sourceFile: ts.SourceFile, file: string): ts.SourceFile {
    // todo: handle aliases
    // todo: handle whatever this is: packages/orgs-v5/commands/access/index.js
    const command = getCommandDeclaration(sourceFile)
    if (command) {
      const staticClassMembers = createClassElementsFromModuleExports(command)
      const updateClassDef = (node: ts.Node): ts.Node => {
        if (isExtendedCommandClassDeclaration(node)) {
          return ts.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            [...staticClassMembers, ...node.members],
          )
        }

        return ts.visitEachChild(node, updateClassDef, nullTransformationContext)
      }

      return ts.visitEachChild(sourceFile, updateClassDef, nullTransformationContext)
    }

    console.error(`unhandled command declaration in ${file}`)

    return sourceFile
  }

  private migrateHerokuCliUtilsExports(sourceFile: ts.SourceFile, file: string): ts.SourceFile {
    const importName = findRequiredPackageVarNameIfExits(sourceFile, '@heroku/heroku-cli-util')

    //  todo: hoist requires to top of the file?
    if (!importName) {
      // not found. continue transforms
      console.error(`heroku-cli-utils import missing: ${file}`)
    }

    const visitor = (node: ts.Node): ts.Node => {
      const newNode = transformCliUtils(node, importName, file)

      return ts.visitEachChild(newNode, visitor, nullTransformationContext)
    }

    return ts.visitEachChild(sourceFile, visitor, nullTransformationContext)
  }

  async writeSourceFile(content: string, originalFilePath: string): Promise<void> {
    const {dir, name} = path.parse(originalFilePath)

    const exported = require(`../../${originalFilePath.split('/packages/')[1]}`)
    const commandConfig = Array.isArray(exported) ? exported[0] : exported
    const {topic, command = ''} = commandConfig
    const commandParts = command.split(':')
    let commandName = command || name

    // some command declarations use topic separators. example: command: 'maintenance:run'
    if (commandParts.length > 1) {
      commandName = commandParts[commandParts.length - 1]
    }

    const pathFromCommands = dir.split('/commands/')[1] || ''

    let finalDirPath = path.join(path.resolve(this.outputLocation), 'commands', ...pathFromCommands.split('/'), commandName)
    if (topic) {
      const topicParts = topic.split(':')
      if (commandParts.length > 1) {
        topicParts.push(...commandParts.slice(0, -1))
      }

      finalDirPath = path.join(this.outputLocation, 'commands', path.join(...topicParts))
    }

    const finalPath = path.join(finalDirPath, `${commandName}.ts`)
    const exists = !this.allowOverwrite && await fs.stat(finalPath)
      .catch(() => false)

    if (exists) {
      console.error(`Overwrite during migration of ${originalFilePath} to ${finalPath}`)
      return
    }

    await fs.mkdir(finalDirPath, {recursive: true})
    await fs.writeFile(finalPath, content)
  }
}

const REPLACE_IMPORT_PATH = '__IMPORT_PATH_TO_GET_CONFIG__'
export class CommandTestMigrationFactory extends MigrationFactoryBase {
  protected readonly outputLocation: string = path.join('packages', 'cli', 'test', 'unit')
  protected commonImports = `import {stdout, stderr} from 'stdout-stderr'
  import Cmd  from 'REPLACE_WITH_PATH_TO_COMMAND'
  import runCommand from '${REPLACE_IMPORT_PATH}'
  `

  constructor(files: string[], compilerOptions: ts.CompilerOptions, outDir?: string, allowOverwrite?: boolean) {
    super(files, compilerOptions, outDir, allowOverwrite)
    if (outDir) {
      this.outputLocation = outDir
    }

    if (allowOverwrite) {
      this.allowOverwrite = true
    }
  }

  public async migrate(): Promise<void> {
    const lintOperations: Promise<ESLint.LintResult[]>[] = []
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i]
      let ast = this.program.getSourceFile(file)

      try {
        ast = migrateTestFile(ast)
        ast = this.updateOrRemoveStatements(ast, true)

        const sourceFile = ts.createSourceFile(path.basename(file), '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
        let sourceStr = this.commonImports + this.printer.printList(ts.ListFormat.MultiLine, ast.statements, sourceFile)

        // simple, reliable regex replace because it's so much easier than handling with TS
        sourceStr = sourceStr.replace(/cli.stdout/g, 'stdout.output')
          .replace(/cli.stderr/g, 'stderr.output')

        lintOperations.push(this.linter.lintText(sourceStr, {filePath: file}))
      } catch (error: any) {
        console.error(`error file: ${file}`)
        throw error
      }
    }

    const lintResults = await Promise.all(lintOperations)
    await Promise.all(lintResults.map(res => this.writeSourceFile(res[0].output, res[0].filePath)))
    stdout.write(`Migrated ${lintResults.length} tests.\n`)
  }

  getCommandPath(originalFilePath: string): {finalDirPath: string, finalPath: string} {
    const {dir, name} = path.parse(originalFilePath)

    const pathFromCommands = dir.split('/commands/')[1] || ''

    const finalDirPath = path.join(path.resolve(this.outputLocation), 'commands', ...pathFromCommands.split('/'))

    return {finalDirPath, finalPath: path.join(finalDirPath, `${name}.ts`)}
  }

  async writeSourceFile(content: string, originalFilePath: string): Promise<void> {
    const {finalPath, finalDirPath} = this.getCommandPath(originalFilePath)
    // replace import path in this.commonImports to be correct
    content = content.replace(REPLACE_IMPORT_PATH, path.relative(finalDirPath, path.join('packages', 'cli', 'test', 'helpers', 'runCommand')))

    const exists = !this.allowOverwrite && await fs.stat(finalPath)
      .catch(() => false)
    if (exists) {
      console.error(`Overwrite during migration of ${originalFilePath} to ${finalPath}`)
      return
    }

    await fs.mkdir(finalDirPath, {recursive: true})
    await fs.writeFile(finalPath, content)
  }
}
