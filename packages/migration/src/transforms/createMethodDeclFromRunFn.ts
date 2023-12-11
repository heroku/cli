import {assert} from 'console'
import {nullTransformationContext} from '../nullTransformationContext.js'
import ts from 'typescript'

export function createMethodDeclFromRunFn(runFunctionDecl: ts.FunctionDeclaration, className: ts.Identifier): ts.MethodDeclaration {
  assert(runFunctionDecl.parameters.length < 3, `Expected 3 params in the run function, got ${runFunctionDecl.parameters.length}`)

  let {body} = runFunctionDecl
  const {parameters, name} = runFunctionDecl
  if (parameters.length > 0) {
    const interimRunFnDecl = migrateRunFnParamsToObjectBindingPattern(runFunctionDecl, className);
    ({body} = updatePropertyAccessChainsToAlignWithBindingPattern(interimRunFnDecl))
  }

  const methodDecl = ts.factory.createMethodDeclaration([ts.factory.createModifier(ts.SyntaxKind.PublicKeyword), ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
    undefined,
    name.text,
    undefined,
    undefined,
    undefined,
    ts.factory.createTypeReferenceNode('Promise', [ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)]),
    body)

  return methodDecl
}

function migrateRunFnParamsToObjectBindingPattern(runFunctionDecl: ts.FunctionDeclaration, className: ts.Identifier): ts.FunctionDeclaration {
  const [contextParam, herokuParam] = runFunctionDecl.parameters // could be named anything so we'll grab names from the identifiers

  //-------------------
  // const {flags, argv, args} = await this.parse(ClassName)
  //-------------------

  // this.parse
  const thisDotParse = ts.factory.createPropertyAccessExpression(ts.factory.createThis(), 'parse')
  // this.parse(ClassName)
  const callThisDotParse = ts.factory.createCallExpression(thisDotParse, undefined, [className])
  // await this.parse(ClassName)
  const awaitCallThisDotParse = ts.factory.createAwaitExpression(callThisDotParse)
  // {flags, argv, args}
  const bindingElements = [
    ts.factory.createBindingElement(undefined, undefined, ts.factory.createIdentifier('flags')),
    ts.factory.createBindingElement(undefined, undefined, ts.factory.createIdentifier('argv')),
    ts.factory.createBindingElement(undefined, undefined, ts.factory.createIdentifier('args')),
  ]

  const objectBindingPattern = ts.factory.createObjectBindingPattern(bindingElements)
  // const {flags, argv, args} = await this.parse(ClassName)
  const variableDecl = ts.factory.createVariableDeclaration(objectBindingPattern, undefined, undefined, awaitCallThisDotParse)
  const variableDeclList = ts.factory.createVariableDeclarationList([variableDecl], ts.NodeFlags.Const)

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

function updatePropertyAccessChainsToAlignWithBindingPattern(runFunctionDecl: ts.FunctionDeclaration): ts.FunctionDeclaration {
  const visitor = (node: ts.Node): ts.Node => {
    node = ts.visitEachChild(node, visitor, nullTransformationContext)
    if (!ts.isPropertyAccessExpression(node)) {
      return node
    }

    switch (contextOrHerokuPropertyAccessExpression(node)) {
    // e.g. heroku.get() ---> this.heroku.get()
    case 'heroku':
      return ts.factory.updatePropertyAccessExpression(node,
        ts.factory.createPropertyAccessExpression(ts.factory.createThis(), ts.factory.createIdentifier('heroku')),
        node.name)

    // e.g. context.flags ---> flags
    case 'context':
      return node.name

    default:
      return node
    }
  }

  return ts.visitEachChild(runFunctionDecl, visitor, nullTransformationContext)
}

function contextOrHerokuPropertyAccessExpression(node: ts.PropertyAccessExpression): 'heroku' | 'context' | undefined {
  if (ts.isIdentifier(node.expression)) {
    switch (node.expression.escapedText) {
    case 'heroku':
      return 'heroku'

    case 'context':
      return 'context'

    default:
      return null
    }
  }
}
