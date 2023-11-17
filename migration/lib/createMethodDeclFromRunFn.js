import { assert } from 'console';
import { nullTransformationContext } from './nullTransformationContext.js';
import ts from 'typescript';
export function createMethodDeclFromRunFn(runFunctionDecl, className) {
    assert(runFunctionDecl.parameters.length < 3, `Expected 3 params in the run function, got ${runFunctionDecl.parameters.length}`);
    let { body } = runFunctionDecl;
    const { parameters, name } = runFunctionDecl;
    if (parameters.length > 0) {
        const interimRunFnDecl = migrateRunFnParamsToObjectBindingPattern(runFunctionDecl, className);
        ({ body } = updatePropertyAccessChainsToAlignWithBindingPattern(interimRunFnDecl));
    }
    const metdodDecl = ts.factory.createMethodDeclaration([ts.factory.createModifier(ts.SyntaxKind.PublicKeyword), ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)], undefined, name.text, undefined, undefined, undefined, ts.factory.createTypeReferenceNode('Promise', [ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)]), body);
    return metdodDecl;
}
function migrateRunFnParamsToObjectBindingPattern(runFunctionDecl, className) {
    const [contextParam, herokuParam] = runFunctionDecl.parameters; // could be named anything so we'll grab names from the identifiers
    //-------------------
    // const {flags, argv, args} = await this.parse(ClassName)
    //-------------------
    // this.parse
    const thisDotParse = ts.factory.createPropertyAccessExpression(ts.factory.createThis(), 'parse');
    // this.parse(ClassName)
    const callThisDotParse = ts.factory.createCallExpression(thisDotParse, undefined, [className]);
    // await this.parse(ClassName)
    const awaitCallThisDotParse = ts.factory.createAwaitExpression(callThisDotParse);
    // {flags, argv, args}
    const bindingElements = [
        ts.factory.createBindingElement(undefined, undefined, ts.factory.createIdentifier('flags')),
        ts.factory.createBindingElement(undefined, undefined, ts.factory.createIdentifier('argv')),
        ts.factory.createBindingElement(undefined, undefined, ts.factory.createIdentifier('args')),
    ];
    const objectBindingPattern = ts.factory.createObjectBindingPattern(bindingElements);
    // const {flags, argv, args} = await this.parse(ClassName)
    const variableDecl = ts.factory.createVariableDeclaration(objectBindingPattern, undefined, undefined, awaitCallThisDotParse);
    const variableDeclList = ts.factory.createVariableDeclarationList([variableDecl], ts.NodeFlags.Const);
    return ts.factory.updateFunctionDeclaration(runFunctionDecl, runFunctionDecl.modifiers, runFunctionDecl.asteriskToken, runFunctionDecl.name, runFunctionDecl.typeParameters, runFunctionDecl.parameters, runFunctionDecl.type, ts.factory.updateBlock(runFunctionDecl.body, [ts.factory.createVariableStatement(undefined, variableDeclList), ...runFunctionDecl.body.statements]));
}
function updatePropertyAccessChainsToAlignWithBindingPattern(runFunctionDecl) {
    const visitor = (node) => {
        node = ts.visitEachChild(node, visitor, nullTransformationContext);
        if (!ts.isPropertyAccessExpression(node)) {
            return node;
        }
        switch (contextOrHerokuPropertyAccessExpression(node)) {
            // e.g. heroku.get() ---> this.heroku.get()
            case 'heroku':
                return ts.factory.updatePropertyAccessExpression(node, ts.factory.createPropertyAccessExpression(ts.factory.createThis(), ts.factory.createIdentifier('heroku')), node.name);
            // e.g. context.flags ---> flags
            case 'context':
                return node.name;
            default:
                return node;
        }
    };
    return ts.visitEachChild(runFunctionDecl, visitor, nullTransformationContext);
}
function contextOrHerokuPropertyAccessExpression(node) {
    if (ts.isIdentifier(node.expression)) {
        switch (node.expression.escapedText) {
            case 'heroku':
                return 'heroku';
            case 'context':
                return 'context';
            default:
                return null;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlTWV0aG9kRGVjbEZyb21SdW5Gbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jcmVhdGVNZXRob2REZWNsRnJvbVJ1bkZuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxTQUFTLENBQUE7QUFDOUIsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZ0NBQWdDLENBQUE7QUFDeEUsT0FBTyxFQUFFLE1BQU0sWUFBWSxDQUFBO0FBRTNCLE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxlQUF1QyxFQUFFLFNBQXdCO0lBQ3pHLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsOENBQThDLGVBQWUsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQTtJQUVoSSxJQUFJLEVBQUMsSUFBSSxFQUFDLEdBQUcsZUFBZSxDQUFBO0lBQzVCLE1BQU0sRUFBQyxVQUFVLEVBQUUsSUFBSSxFQUFDLEdBQUcsZUFBZSxDQUFBO0lBQzFDLElBQUksVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDekIsTUFBTSxnQkFBZ0IsR0FBRyx3Q0FBd0MsQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUYsQ0FBQyxFQUFDLElBQUksRUFBQyxHQUFHLG1EQUFtRCxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQTtLQUNqRjtJQUVELE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsRUFDbkssU0FBUyxFQUNULElBQUksQ0FBQyxJQUFJLEVBQ1QsU0FBUyxFQUNU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