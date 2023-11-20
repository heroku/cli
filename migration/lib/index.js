import path from 'node:path';
import fs from 'node:fs/promises';
import pascalcase from 'pascalcase';
import ts from 'typescript';
import { ESLint } from 'eslint';
import { createClassElementsFromModuleExports } from './createClassElementFromModuleExports.js';
import { createCommandClass } from './createCommandClass.js';
import { isModuleExports } from './isModuleExports.js';
import { isRunFunctionDecl } from './isRunFunctionDecl.js';
import { nullTransformationContext } from './nullTransformationContext.js';
import { isMigrationCandidate } from './isMigrationCandidate.js';
const commonImports = `import {createRequire} from 'node:module'
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

const require = createRequire(import.meta.url)
`;
export class CommandMigrationFactory {
    static outputLocation = 'converted';
    program;
    printer;
    linter;
    files;
    constructor(files, compilerOptions) {
        this.files = files;
        this.program = ts.createProgram({ rootNames: files, options: compilerOptions, host: ts.createCompilerHost(compilerOptions) });
        this.printer = ts.createPrinter({ newLine: ts.NewLineKind.CarriageReturnLineFeed });
        this.linter = new ESLint({ fix: true });
    }
    async migrate() {
        const lintOperations = [];
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            let ast = this.program.getSourceFile(file);
            if (!isMigrationCandidate(ast)) {
                continue;
            }
            ast = this.migrateRunFunctionDecl(ast, file);
            ast = this.migrateModuleExports(ast);
            ast = this.updateOrRemoveStatements(ast);
            const sourceFile = ts.createSourceFile(path.basename(file), '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
            const sourceStr = commonImports + this.printer.printList(ts.ListFormat.MultiLine, ast.statements, sourceFile);
            lintOperations.push(this.linter.lintText(sourceStr, { filePath: file }));
        }
        const lintResults = await Promise.all(lintOperations);
        await Promise.all(lintResults.map(res => this.writeSourceFile(res[0].output, res[0].filePath)));
    }
    migrateRunFunctionDecl(node, filePath) {
        const visitor = (node) => {
            if (isRunFunctionDecl(node)) {
                const className = pascalcase(path.parse(filePath).name);
                return createCommandClass(node, ts.factory.createIdentifier(className));
            }
            return node;
        };
        return ts.visitEachChild(node, visitor, nullTransformationContext);
    }
    migrateModuleExports(node) {
        const visitor = (node) => {
            if (isModuleExports(node)) {
                const classElementsFromModuleExports = createClassElementsFromModuleExports(node.right);
            }
            return ts.visitEachChild(node, visitor, nullTransformationContext);
        };
        return ts.visitEachChild(node, visitor, nullTransformationContext);
    }
    updateOrRemoveStatements(node) {
        const visitor = (node) => {
            // 'use strict'
            if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === 'use strict') {
                return null;
            }
            // module.exports
            if (ts.isExpressionStatement(node) && isModuleExports(node.expression)) {
                return null;
            }
            // some string literals that are no longer aligned with
            // the original source file do not print properly
            // recreating them seems to workaround this issue.
            if (ts.isStringLiteral(node)) {
                return ts.factory.createStringLiteral(node.text);
            }
            return ts.visitEachChild(node, visitor, nullTransformationContext);
        };
        return ts.visitEachChild(node, visitor, nullTransformationContext);
    }
    async writeSourceFile(content, originalFilePath) {
        const { dir, name } = path.parse(originalFilePath);
        const pathFromRoot = dir.replace(process.cwd(), '');
        const finalPath = path.join(path.resolve(CommandMigrationFactory.outputLocation), pathFromRoot);
        await fs.mkdir(finalPath, { recursive: true });
        await fs.writeFile(path.join(finalPath, `${pascalcase(name)}.ts`), content);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQzVCLE9BQU8sRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBQ2pDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQTtBQUNuQyxPQUFPLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFDM0IsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFFBQVEsQ0FBQTtBQUU3QixPQUFPLEVBQUMsb0NBQW9DLEVBQUMsTUFBTSwwQ0FBMEMsQ0FBQTtBQUM3RixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQTtBQUMxRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sc0JBQXNCLENBQUE7QUFDcEQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sd0JBQXdCLENBQUE7QUFDeEQsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZ0NBQWdDLENBQUE7QUFDeEUsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sMkJBQTJCLENBQUE7QUFFOUQsTUFBTSxhQUFhLEdBQUc7Ozs7Ozs7Q0FPckIsQ0FBQTtBQUNELE1BQU0sT0FBTyx1QkFBdUI7SUFDeEIsTUFBTSxDQUFDLGNBQWMsR0FBRyxXQUFvQixDQUFBO0lBRWpDLE9BQU8sQ0FBYTtJQUNwQixPQUFPLENBQWE7SUFDcEIsTUFBTSxDQUFRO0lBQ2hCLEtBQUssQ0FBVztJQUVqQyxZQUFZLEtBQWUsRUFBRSxlQUFtQztRQUM5RCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsRUFBQyxDQUFD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