import {
  type AwaitExpression,
  type CallExpression,
  Node,
  type SourceFile,
  SyntaxKind,
  type TemplateExpression,
  type VariableDeclaration,
} from 'ts-morph'

import {type HttpVerb, RouteIndex} from './routes-index.js'

export type TransformResult = {
  changed: boolean
  flags: string[]
  unmatched: number
  warnings: string[]
}

const VERBS: Record<string, HttpVerb> = {
  delete: 'DELETE',
  get: 'GET',
  patch: 'PATCH',
  post: 'POST',
  put: 'PUT',
}

const HEROKU_SCHEMA_IMPORT = '@heroku-cli/schema'
const HEROKU_SDK_IMPORT = '@heroku/sdk'

export function transform(sourceFile: SourceFile, index: RouteIndex): TransformResult {
  const result: TransformResult = {changed: false, flags: [], unmatched: 0, warnings: []}

  const calls = collectHerokuCalls(sourceFile)
  if (calls.length === 0) return result

  // Process from bottom-up so earlier edits don't invalidate later node references.
  calls.sort((a, b) => b.call.getStart() - a.call.getStart())

  for (const ctx of calls) {
    if (ctx.call.wasForgotten()) continue
    const replaced = replaceCall(ctx, index, result)
    if (replaced) result.changed = true
  }

  if (result.changed) {
    ensureSdkSetup(sourceFile, result)
    pruneUnusedSchemaImport(sourceFile)
  }

  return result
}

type CallContext = {
  call: CallExpression
  verb: HttpVerb
  verbName: string
}

function collectHerokuCalls(sourceFile: SourceFile): CallContext[] {
  const out: CallContext[] = []
  sourceFile.forEachDescendant(node => {
    if (!Node.isCallExpression(node)) return
    const expr = node.getExpression()
    if (!Node.isPropertyAccessExpression(expr)) return
    const verbName = expr.getName()
    const verb = VERBS[verbName]
    if (!verb) return
    const receiver = expr.getExpression()
    if (!Node.isPropertyAccessExpression(receiver)) return
    if (receiver.getName() !== 'heroku') return
    if (receiver.getExpression().getKind() !== SyntaxKind.ThisKeyword) return
    out.push({call: node, verb, verbName})
  })
  return out
}

function replaceCall(ctx: CallContext, index: RouteIndex, result: TransformResult): boolean {
  const {call, verb, verbName} = ctx
  const args = call.getArguments()
  if (args.length === 0) {
    flagCall(call, `no path argument for this.heroku.${verbName}`, result)
    return false
  }

  const pathArg = args[0]
  const pathInfo = extractPath(pathArg)
  if (!pathInfo) {
    flagCall(call, `cannot statically extract path from this.heroku.${verbName}(...)`, result)
    result.unmatched++
    return false
  }

  let lookup
  try {
    lookup = index.lookup(verb, pathInfo.concretePath)
  } catch (error: unknown) {
    flagCall(call, (error as Error).message, result)
    result.unmatched++
    return false
  }

  if (!lookup) {
    flagCall(call, `no SDK route maps to ${verb} ${pathInfo.concretePath}`, result)
    result.unmatched++
    return false
  }

  const {entry} = lookup
  const placeholderSlots = entry.path.match(/\{[a-zA-Z][a-zA-Z0-9]*\}/g) ?? []
  if (placeholderSlots.length !== pathInfo.params.length) {
    flagCall(
      call,
      `placeholder count mismatch: SDK route ${entry.path} has ${placeholderSlots.length} but call provided ${pathInfo.params.length}`,
      result,
    )
    result.unmatched++
    return false
  }

  const sdkArgs = [...pathInfo.params]
  if (entry.hasRequestBody) {
    if (args.length < 2) {
      flagCall(call, `SDK method platform.${entry.resource}.${entry.method} requires a request body`, result)
      result.unmatched++
      return false
    }

    const bodyArg = args[1]
    const bodyText = unwrapHttpCallBody(bodyArg)
    if (bodyText === null) {
      flagCall(
        call,
        `cannot determine SDK request body shape for platform.${entry.resource}.${entry.method}; review the second argument manually`,
        result,
      )
      result.unmatched++
      return false
    }

    sdkArgs.push(bodyText)
  } else if (args.length > 1) {
    // Don't replace this call — too risky to silently drop a request-options arg.
    flagCall(
      call,
      `this.heroku.${verbName}(...) has an extra argument (request options?) that platform.${entry.resource}.${entry.method} does not accept; review manually`,
      result,
    )
    result.unmatched++
    return false
  }

  const replacement = `platform.${entry.resource}.${entry.method}(${sdkArgs.join(', ')})`

  const wrapping = findEnclosingAwaitOrBindingContext(call)
  rewriteCallSite(call, replacement, wrapping, result)
  return true
}

type PathInfo = {
  /** Path with placeholders replaced by a non-slash sentinel so route regexes match. */
  concretePath: string
  /** Source-form expressions for each placeholder, in order. */
  params: string[]
}

const PARAM_SENTINEL = 'codemodparam'

function extractPath(node: Node): null | PathInfo {
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    return {concretePath: node.getLiteralValue(), params: []}
  }

  if (Node.isTemplateExpression(node)) {
    return extractFromTemplate(node)
  }

  return null
}

function unwrapHttpCallBody(node: Node): null | string {
  // The CLI's http-call wraps requests as `{body: <actual-body>, ...}`. The SDK takes the body directly.
  // If the second arg is an object literal with a single `body` property, return its value.
  if (!Node.isObjectLiteralExpression(node)) {
    // Could be a variable holding the body; pass it through as-is.
    return node.getText()
  }

  const properties = node.getProperties()
  if (properties.length !== 1) return null

  const property = properties[0]
  if (!Node.isPropertyAssignment(property)) return null
  if (property.getName() !== 'body') return null

  return property.getInitializer()?.getText() ?? null
}

function extractFromTemplate(template: TemplateExpression): PathInfo {
  const params: string[] = []
  let concretePath = template.getHead().getLiteralText()

  for (const span of template.getTemplateSpans()) {
    params.push(span.getExpression().getText())
    concretePath += PARAM_SENTINEL
    concretePath += span.getLiteral().getLiteralText()
  }

  return {concretePath, params}
}

function rewriteCallSite(
  call: CallExpression,
  replacement: string,
  wrapping: WrappingContext,
  result: TransformResult,
): void {
  if (wrapping.kind === 'await-with-body-destructure') {
    const decl = wrapping.declaration
    const newName = wrapping.bodyAlias
    decl.replaceWithText(`${newName} = await ${replacement}`)
    return
  }

  if (wrapping.kind === 'await') {
    call.replaceWithText(replacement)
    return
  }

  if (wrapping.kind === 'bare-promise') {
    call.replaceWithText(replacement)
    return
  }

  result.warnings.push(`unrecognized call wrapping for replacement at line ${call.getStartLineNumber()}`)
  call.replaceWithText(replacement)
}

type WrappingContext =
  | {await: AwaitExpression; bodyAlias: string; declaration: VariableDeclaration; kind: 'await-with-body-destructure'}
  | {await: AwaitExpression; kind: 'await'}
  | {kind: 'bare-promise'}

function findEnclosingAwaitOrBindingContext(call: CallExpression): WrappingContext {
  const parent = call.getParent()
  if (!parent || !Node.isAwaitExpression(parent)) {
    return {kind: 'bare-promise'}
  }

  const awaitNode = parent
  const declaration = awaitNode.getParentIfKind(SyntaxKind.VariableDeclaration)
  if (!declaration) return {await: awaitNode, kind: 'await'}

  const nameNode = declaration.getNameNode()
  if (!Node.isObjectBindingPattern(nameNode)) return {await: awaitNode, kind: 'await'}

  const elements = nameNode.getElements()
  if (elements.length !== 1) return {await: awaitNode, kind: 'await'}

  const element = elements[0]
  const propertyNode = element.getPropertyNameNode()
  const propertyName = propertyNode ? propertyNode.getText() : element.getName()
  if (propertyName !== 'body') return {await: awaitNode, kind: 'await'}

  return {
    await: awaitNode,
    bodyAlias: element.getName(),
    declaration,
    kind: 'await-with-body-destructure',
  }
}

function flagCall(call: CallExpression, message: string, result: TransformResult): void {
  result.flags.push(message)
  const stmt = call.getFirstAncestorByKind(SyntaxKind.ExpressionStatement) ?? call.getFirstAncestorByKind(SyntaxKind.VariableStatement)
  const target = stmt ?? call
  const sourceFile = target.getSourceFile()
  const fullText = sourceFile.getFullText()
  const lineStart = fullText.lastIndexOf('\n', target.getStart() - 1) + 1
  const indent = fullText.slice(lineStart, target.getStart()).match(/^[\t ]*/)?.[0] ?? ''
  target.replaceWithText(`// TODO(sdk-migration): ${message}\n${indent}${target.getText()}`)
}

function ensureSdkSetup(sourceFile: SourceFile, result: TransformResult): void {
  const existing = sourceFile.getImportDeclaration(d => d.getModuleSpecifierValue() === HEROKU_SDK_IMPORT)
  if (!existing) {
    // Insert at the top of the imports block; the project formats named imports without inner-brace spaces.
    const firstStatement = sourceFile.getStatementsWithComments()[0]
    const insertPos = firstStatement?.getStart() ?? 0
    sourceFile.insertText(insertPos, `import {HerokuSDK} from '${HEROKU_SDK_IMPORT}'\n`)
  } else {
    const named = existing.getNamedImports().map(n => n.getName())
    if (!named.includes('HerokuSDK')) existing.addNamedImport('HerokuSDK')
  }

  const usesPlatform = sourceFile.getText().includes('platform.')
  if (!usesPlatform) return

  const runMethod = sourceFile
    .getClasses()
    .flatMap(c => c.getInstanceMethods())
    .find(m => m.getName() === 'run')

  if (!runMethod) {
    result.warnings.push('could not locate run() method to insert SDK construction')
    return
  }

  const body = runMethod.getBodyText() ?? ''
  if (body.includes('new HerokuSDK')) return

  runMethod.insertStatements(0, 'const {platform} = new HerokuSDK()')
}

function pruneUnusedSchemaImport(sourceFile: SourceFile): void {
  const decl = sourceFile.getImportDeclaration(d => d.getModuleSpecifierValue() === HEROKU_SCHEMA_IMPORT)
  if (!decl) return

  const namespace = decl.getNamespaceImport()
  if (!namespace) return

  const name = namespace.getText()
  const stillUsed = sourceFile
    .getDescendantsOfKind(SyntaxKind.Identifier)
    .filter(id => id.getText() === name && id !== namespace)
    .length > 0

  if (!stillUsed) decl.remove()
}
