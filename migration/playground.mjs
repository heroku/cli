import ts from 'typescript';
const file = '../packages/cli/src/commands/rake.ts';
const compilerOptions = {
    moduleResolution: ts.ModuleResolutionKind.Node10,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
    allowJs: true,
};
const program = ts.createProgram({ rootNames: [file], options: compilerOptions, host: ts.createCompilerHost(compilerOptions) });
const ast = program.getSourceFile(file);
debugger;