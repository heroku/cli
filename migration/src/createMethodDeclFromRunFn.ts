import {assert} from 'console'
import {nullTransformationContext} from './nullTransformationContext.js'
import ts from 'typescript'

export function createMethodDeclFromRunFn(runFunctionDecl: ts.FunctionDeclaration, className: ts.Identifier): ts.MethodDeclaration {
  assert(runFunctionDecl.parameters.length < 3, `Expected 3 params in the run function, got ${runFunctionDecl.parameters.length}`)

  let {body} = runFunctionDecl
  const {parameters, name} = runFunctionDecl
  if (parameters.length > 0) {
    const interimRunFnDecl = migrateRunFnParamsToObjectBindingPattern(runFunctionDecl, className);
    ({body} = updatePropertyAccessChainsToOmitParamNames(interimRunFnDecl))
  }

  const metdodDecl = ts.factory.createMethodDeclaration([ts.factory.createModifier(ts.SyntaxKind.PublicKeyword), ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
    undefined,
    name.text,
    undefined,
    undefined,
    undefined,
    ts.factory.createTypeReferenceNode('Promise', [ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)]),
    body)

  return metdodDecl
}

function migrateRunFnParamsToObjectBindingPattern(runFunctionDecl: ts.FunctionDeclaration, className: ts.Identifier): ts.FunctionDeclaration {
  const [contextParam, herokuParam] = runFunctionDecl.parameters // could be named anything so we'll grab names from the identifiers

  //-------------------
  // const {flags, argv} = await this.parse(ClassName)
  //-------------------

  // this.parse
  const thisDotParse = ts.factory.createPropertyAccessExpression(ts.factory.createThis(), 'parse')
  // this.parse(ClassName)
  const callThisDotParse = ts.factory.createCallExpression(thisDotParse, undefined, [className])
  // await this.parse(ClassName)
  const awaitCallThisDotParse = ts.factory.createAwaitExpression(callThisDotParse)
  // {flags, argv}
  const bindingElements = [ts.factory.createBindingElement(undefined, undefined, contextParam.name)]
  if (herokuParam) {
    bindingElements.push(ts.factory.createBindingElement(undefined, undefined, herokuParam.name))
  }

  const objectBindingPattern = ts.factory.createObjectBindingPattern(bindingElements)
  // const {flags, argv} = await this.parse(ClassName)
  const variableDecl = ts.factory.createVariableDeclaration(objectBindingPattern, undefined, undefined, awaitCallThisDotParse)
  const variableDeclList = ts.factory.createVariableDeclarationList([variableDecl])

  return ts.factory.updateFunctionDeclaration(
    runFunctionDecl,
    runFunctionDecl.modifiers,
    runFunctionDecl.asteriskToken,
    runFunctionDecl.name,
    runFunctionDecl.typeParameters,
    runFunctionDecl.parameters,
    runFunctionDecl.type,
    ts.factory.updateBlock(runFunctionDecl.body, [ts.factory.createVariableStatement(undefined, variableDeclList), ...runFunctionDecl.body.statements]))
}

function updatePropertyAccessChainsToOmitParamNames(runFunctionDecl: ts.FunctionDeclaration): ts.FunctionDeclaration {
  const visitor = (node: ts.Node): ts.Node => {
    node = ts.visitEachChild(node, visitor, nullTransformationContext)
    // context.flags ---> flags
    if (isPropertyAccessExpressionThatMatchesParamName(node, runFunctionDecl.parameters as ts.NodeArray<ts.ParameterDeclaration & { name: ts.Identifier }>)) {
      return node.name
    }

    return node
  }

  return ts.visitEachChild(runFunctionDecl, visitor, nullTransformationContext)
}

function isPropertyAccessExpressionThatMatchesParamName(node: ts.Node, params: ts.NodeArray<ts.ParameterDeclaration & { name: ts.Identifier }>): node is ts.PropertyAccessExpression {
  return params.some(param => ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && (node.expression.escapedText === param.name.escapedText))
}
