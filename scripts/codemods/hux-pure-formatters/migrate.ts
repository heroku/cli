/* eslint-disable */
// cspell:ignore bhux
// Migrates call sites to @heroku/heroku-cli-util v11, where hux.styledHeader, hux.styledObject,
// and hux.table return the rendered string instead of printing it, and hux.styledJSON is removed.
// Idempotent: already-wrapped calls are not touched. See README.md.
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const FORMATTERS = new Set(['styledHeader', 'styledObject', 'table'])
const TODO = '// TODO(hux-pure-formatters): hux.styledJSON outside a --json branch; use this.log(ux.colorizeJson(...)) for human output or this.logJson(...) for --json output'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const targets = args.filter(a => a !== '--dry-run')
if (targets.length === 0) targets.push('src')

const files: string[] = []
const walk = (p: string) => {
  if (fs.statSync(p).isDirectory()) {
    for (const e of fs.readdirSync(p)) walk(path.join(p, e))
  } else if (p.endsWith('.ts') && !p.endsWith('.d.ts')) files.push(p)
}

for (const t of targets) walk(t)

// True when `this` at node is an instance of an oclif command: the nearest enclosing non-arrow
// function is an instance method of a class that extends something named *Command.
function inCommandMethod(node: ts.Node): boolean {
  let f: ts.Node | undefined = node.parent
  while (f && !ts.isSourceFile(f) && !ts.isFunctionDeclaration(f) && !ts.isFunctionExpression(f)
    && !ts.isMethodDeclaration(f) && !ts.isConstructorDeclaration(f) && !ts.isAccessor(f) && !ts.isPropertyDeclaration(f)) f = f.parent
  if (!f || !ts.isMethodDeclaration(f) || !ts.isClassLike(f.parent)) return false
  if (f.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword)) return false
  return Boolean(f.parent.heritageClauses?.some(h => h.token === ts.SyntaxKind.ExtendsKeyword && /Command\b/.test(h.getText())))
}

// True when an enclosing if/ternary condition mentions json (e.g. `if (flags.json)`).
function inJsonBranch(node: ts.Node): boolean {
  for (let p: ts.Node | undefined = node.parent; p && !ts.isSourceFile(p); p = p.parent) {
    if ((ts.isIfStatement(p) || ts.isConditionalExpression(p)) && /json/i.test(p.getChildAt(ts.isIfStatement(p) ? 2 : 0).getText())) return true
  }

  return false
}

const report = {filesChanged: 0, logJson: 0, thisLog: 0, todo: [] as string[], uxColorizeJson: 0, uxStdout: 0}

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8')
  const src = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  const edits: Array<[number, number, string]> = []
  let needsUx = false

  const visit = (node: ts.Node) => {
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      const call = node.expression
      const callee = call.expression
      if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.expression.text === 'hux') {
        const fn = callee.name.text
        const where = `${file}:${src.getLineAndCharacterOfPosition(call.getStart(src)).line + 1}`
        const inCmd = inCommandMethod(node)
        if (FORMATTERS.has(fn)) {
          const callText = call.getText(src)
          edits.push([call.getStart(src), call.getEnd(), inCmd ? `this.log(${callText})` : `ux.stdout(${callText})`])
          if (inCmd) report.thisLog++
          else {
            report.uxStdout++
            needsUx = true
          }
        } else if (fn === 'styledJSON') {
          const arg = call.arguments.length === 1 ? call.arguments[0].getText(src) : undefined
          if (!arg || !inJsonBranch(node)) {
            const lineStart = text.lastIndexOf('\n', node.getStart(src)) + 1
            const indent = text.slice(lineStart, node.getStart(src))
            if (!text.slice(Math.max(0, lineStart - TODO.length - indent.length - 1), lineStart).includes('TODO(hux-pure-formatters)')) {
              edits.push([lineStart, lineStart, `${indent}${TODO}\n`])
            }

            report.todo.push(where)
          } else if (inCmd) {
            edits.push([call.getStart(src), call.getEnd(), `this.logJson(${arg})`])
            report.logJson++
          } else {
            // Not in a command method, so there is no this.logJson; keep the old behavior exactly.
            edits.push([call.getStart(src), call.getEnd(), `ux.stdout(ux.colorizeJson(${arg}))`])
            report.uxColorizeJson++
            needsUx = true
          }
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(src)
  if (edits.length === 0) continue
  edits.sort((a, b) => b[0] - a[0])
  for (const [s, e, r] of edits) text = text.slice(0, s) + r + text.slice(e)

  // Imports: add a `ux` binding when ux.stdout/colorizeJson was introduced; drop `hux` if unused.
  const src2 = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  const imports = src2.statements.filter(ts.isImportDeclaration)
  const named = (i: ts.ImportDeclaration) => {
    const nb = i.importClause?.namedBindings
    return nb && ts.isNamedImports(nb) ? nb : undefined
  }

  const spec = (i: ts.ImportDeclaration) => (i.moduleSpecifier as ts.StringLiteral).text
  const importEdits: Array<[number, number, string]> = []
  if (needsUx && !imports.some(i => named(i)?.elements.some(el => el.name.text === 'ux' && !el.isTypeOnly))) {
    const core = imports.find(i => ['@oclif/core', '@oclif/core/ux'].includes(spec(i)) && named(i) && !i.importClause?.isTypeOnly)
    if (core) {
      const nb = named(core)!
      const names = [...nb.elements.map(e => e.getText(src2)), 'ux'].sort((a, b) => a.localeCompare(b))
      importEdits.push([nb.getStart(src2), nb.getEnd(), `{${names.join(', ')}}`])
    } else {
      const last = imports.at(-1)!
      importEdits.push([last.getEnd(), last.getEnd(), '\nimport {ux} from \'@oclif/core/ux\''])
    }
  }

  if (!/\bhux\./.test(text.replaceAll(/^import .*$/gm, ''))) {
    for (const i of imports) {
      const nb = named(i)
      if (!nb || !spec(i).startsWith('@heroku/heroku-cli-util')) continue
      const rest = nb.elements.filter(e => e.name.text !== 'hux')
      if (rest.length === nb.elements.length) continue
      importEdits.push(rest.length === 0
        ? [i.getFullStart(), i.getEnd(), '']
        : [nb.getStart(src2), nb.getEnd(), `{${rest.map(e => e.getText(src2)).join(', ')}}`])
    }
  }

  importEdits.sort((a, b) => b[0] - a[0])
  for (const [s, e, r] of importEdits) text = text.slice(0, s) + r + text.slice(e)

  report.filesChanged++
  if (!dryRun) fs.writeFileSync(file, text)
}

console.log(JSON.stringify(report, null, 2))
if (report.todo.length > 0) process.exitCode = 1
