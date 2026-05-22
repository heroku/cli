#!/usr/bin/env -S npx tsx
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {IndentationText, NewLineKind, Project, QuoteKind} from 'ts-morph'

import {RouteIndex} from './routes-index.js'
import {transform, type TransformResult} from './transform.js'

type CliOptions = {
  dryRun: boolean
  files: string[]
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {dryRun: false, files: []}
  for (const arg of argv) {
    if (arg === '--dry-run' || arg === '-n') opts.dryRun = true
    else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else if (arg.startsWith('-')) {
      console.error(`unknown flag: ${arg}`)
      process.exit(2)
    } else {
      opts.files.push(arg)
    }
  }

  if (opts.files.length === 0) {
    printHelp()
    process.exit(2)
  }

  return opts
}

function printHelp(): void {
  console.log(`Usage: migrate-command [--dry-run] <command-file.ts> [...more]

Migrates a single oclif command file from raw this.heroku.<verb>(path) calls
to @heroku/sdk platform resource methods.

Flags:
  --dry-run, -n   Print the proposed diff without writing the file.
  --help, -h      Show this help.

Notes:
  - Pass exactly one command source file per invocation for clean review.
  - Multiple files in one invocation are supported but each is migrated independently.
  - Calls the codemod cannot resolve are flagged with TODO comments and the file
    is still written; the agent must resolve those manually.
`)
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2))
  const index = RouteIndex.load()

  const project = new Project({
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      newLineKind: NewLineKind.LineFeed,
      quoteKind: QuoteKind.Single,
      useTrailingCommas: true,
    },
    skipAddingFilesFromTsConfig: true,
    tsConfigFilePath: resolve(process.cwd(), 'tsconfig.json'),
  })

  let totalUnmatched = 0
  for (const file of opts.files) {
    const absPath = resolve(file)
    const before = readFileSync(absPath, 'utf8')
    const sourceFile = project.addSourceFileAtPath(absPath)
    const result = transform(sourceFile, index)
    reportFile(absPath, result, before, sourceFile.getFullText(), opts.dryRun)
    totalUnmatched += result.unmatched
    if (!opts.dryRun && result.changed) await sourceFile.save()
  }

  if (totalUnmatched > 0) {
    console.error(`\n${totalUnmatched} call site(s) could not be migrated automatically. See TODO(sdk-migration) markers.`)
    process.exit(1)
  }
}

function reportFile(path: string, result: TransformResult, before: string, after: string, dryRun: boolean): void {
  const verb = dryRun ? 'would update' : 'updated'
  if (!result.changed) {
    console.log(`no change: ${path}`)
    return
  }

  console.log(`${verb}: ${path}`)
  if (result.flags.length > 0) {
    console.log('  flagged call sites:')
    for (const f of result.flags) console.log(`    - ${f}`)
  }

  if (result.warnings.length > 0) {
    console.log('  warnings:')
    for (const w of result.warnings) console.log(`    - ${w}`)
  }

  if (dryRun) {
    console.log('--- before ---')
    console.log(before)
    console.log('--- after ---')
    console.log(after)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
