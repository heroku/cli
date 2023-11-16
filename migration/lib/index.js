import path from 'node:path';
import pascalcase from 'pascalcase';
import ts from 'typescript';
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

const require = createRequire(imports.meta.url)
`;
export class CommandMigrationFactory {
    program;
    printer;
    files;
    constructor(files, compilerOptions) {
        this.files = files;
        this.program = ts.createProgram({ rootNames: files, options: compilerOptions, host: ts.createCompilerHost(compilerOptions) });
        this.printer = ts.createPrinter({ newLine: ts.NewLineKind.CarriageReturnLineFeed });
    }
    migrate() {
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            let ast = this.program.getSourceFile(file);
            if (!isMigrationCandidate(ast)) {
                continue;
            }
            ast = this.migrateRunFunctionDecl(ast, file);
            ast = this.migrateModuleExports(ast);
            ast = this.removeUnnededStatements(ast);
            const sourceFile = ts.createSourceFile(path.basename(file), '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
            const nodeStrings = commonImports + ast.statements.map(stmt => this.printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile));
            this.writeSourceFile(nodeStrings, file);
        }
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
    removeUnnededStatements(node) {
        const visitor = (node) => {
            // 'use strict'
            if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === 'use strict') {
                return null;
            }
            // module.exports
            if (ts.isExpressionStatement(node) && isModuleExports(node.expression)) {
                return null;
            }
            return ts.visitEachChild(node, visitor, nullTransformationContext);
        };
        return ts.visitEachChild(node, visitor, nullTransformationContext);
    }
    async writeSourceFile(content, originalFilePath) { }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQzVCLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQTtBQUNuQyxPQUFPLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFFM0IsT0FBTyxFQUFDLG9DQUFvQyxFQUFDLE1BQU0sMENBQTBDLENBQUE7QUFDN0YsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0seUJBQXlCLENBQUE7QUFDMUQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFBO0FBQ3BELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHdCQUF3QixDQUFBO0FBQ3hELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGdDQUFnQyxDQUFBO0FBQ3hFLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLDJCQUEyQixDQUFBO0FBRTlELE1BQU0sYUFBYSxHQUFHOzs7Ozs7O0NBT3JCLENBQUE7QUFDRCxNQUFNLE9BQU8sdUJBQXVCO0lBQ2IsT0FBTyxDQUFhO0lBQ3BCLE9BQU8sQ0FBYTtJQUN0QixLQUFLLENBQVc7SUFFakMsWUFBWSxLQUFlLEVBQUUsZUFBbUM7UUFDOUQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7UUFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLEVBQUMsQ0FBQyxDQUFBO1FBQzNILElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLHNCQUFzQixFQUFDLENBQUMsQ0FBQTtJQUNuRixDQUFDO0lBRU0sT0FB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