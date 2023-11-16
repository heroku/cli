import { isModuleExports } from './isModuleExports.js';
import { isRunFunctionDecl } from './isRunFunctionDecl.js';
import ts from 'typescript';
import path from 'node:path';
import { createCommandClass } from 'createCommandClass.js';
import { createClassElementsFromModuleExports } from 'createClassElementFromModuleExports.js';

export class CommandMigrationFactory {

    protected readonly program: ts.Program;
    protected readonly printer: ts.Printer;

    protected nullTransformationContext: ts.TransformationContext = new Proxy({}, {
        get: (target, prop) => {
            if (prop === 'factory') {
                return ts.factory;
            }
            return (node: ts.Node) => node
        }
    }) as ts.TransformationContext;

    private readonly files: string[];


    constructor(files: string[], compilerOptions: ts.CompilerOptions) {
        this.files = files;
        this.program = ts.createProgram({rootNames: files, options: compilerOptions, host: ts.createCompilerHost(compilerOptions)});
        this.printer = ts.createPrinter({newLine: ts.NewLineKind.CarriageReturnLineFeed});
    }

    public migrate(): void {
        this.files.forEach(file => {
            const ast = this.program.getSourceFile(file);
            this.migrateRunFunctionDecl(ast, file);
            this.migrateModuleExports(ast);
        });
    }

    private migrateRunFunctionDecl(node: ts.Node, filePath: string): ts.Node {
        const visitor = (node: ts.Node): ts.Node => {
            if (isRunFunctionDecl(node)) {
                return createCommandClass(node, path.basename(filePath))
            }
            return node;
        };
       return ts.visitEachChild(node, visitor, this.nullTransformationContext);
    }

    private migrateModuleExports(node: ts.Node): ts.Node {
        const visitor = (node: ts.Node): ts.Node => {
            if (isModuleExports(node)) {
                const classElementsFromModuleExports = createClassElementsFromModuleExports(node);
            }
            return ts.visitEachChild(node, visitor, this.nullTransformationContext);;
        }
        return ts.visitEachChild(node, visitor, this.nullTransformationContext);
    }
}