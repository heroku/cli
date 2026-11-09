import type {Command, Config} from '@oclif/core'
import type {Context} from 'mocha'

import {expect} from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import {getConfig} from './test-instances.js'

/**
 * How JSON output is switched on for a run.
 * - `flag`: pass `--json` in argv
 * - `env`: set `HEROKU_CONTENT_TYPE=json` (the CLI's scoped `CONTENT_TYPE` env var)
 */
export type JsonActivation = 'env' | 'flag'

export interface JsonRunResult<T = unknown> {
  /** process.exitCode after the run (undefined on success) */
  exitCode: number | string | undefined
  /** the parsed JSON document written to stdout */
  json: T
  stderr: string
  stdout: string
}

export interface JsonRunOptions {
  activation?: JsonActivation
  /** oclif Config to run against; defaults to the repo's shared test config */
  config?: Config
}

export interface JsonSnapshotOptions {
  /** oclif Config to run against; defaults to the repo's shared test config */
  config?: Config
  /** Distinguishes multiple snapshots taken in one test; appended to the snapshot key */
  name?: string
}

type CommandClass = new (argv: string[], config: Config) => Command

/**
 * Run a command through oclif's command lifecycle (init → run → catch → finally → logJson)
 * with JSON output enabled and return the document it wrote to stdout.
 *
 * This is the lifecycle `heroku <command>` drives once the command is resolved; it does not
 * run the CLI's own init/prerun/postrun/finally hooks or command lookup. Unlike `runCommand`
 * from `@heroku-cli/test-utils` (which calls `run()` directly), it exercises what users see:
 * oclif serializes `run()`'s return value, suppresses `this.log`, and renders errors as JSON.
 *
 * Fails the test if stdout is not exactly one JSON document (catches stray `ux.stdout`,
 * `console.log`, or `hux.*` writes under `--json`) or contains ANSI escape codes.
 */
export async function runCommandJson<T = unknown>(
  Cmd: CommandClass,
  args: string[] = [],
  {activation = 'flag', config: providedConfig}: JsonRunOptions = {},
): Promise<JsonRunResult<T>> {
  const config = providedConfig ?? await getConfig()
  const envKey = config.scopedEnvVarKey('CONTENT_TYPE')
  const argv = activation === 'flag' ? withJsonFlag(args) : [...args]
  const previousEnv = process.env[envKey]
  const previousExitCode = process.exitCode
  let output: {stderr: string, stdout: string}
  let exitCode: JsonRunResult['exitCode']

  // Each activation must be the only one in effect, so an inherited HEROKU_CONTENT_TYPE
  // can't make the --json run pass for the wrong reason.
  if (activation === 'env') process.env[envKey] = 'json'
  else delete process.env[envKey]
  process.exitCode = undefined

  try {
    // `_run` is oclif's (protected) lifecycle entry point. The public static `Command.run`
    // wraps it but also reloads the Config and writes a guessed `id` onto the command class,
    // which would leak into later tests, so the instance is driven directly.
    const cmd = new Cmd(argv, config) as unknown as {_run(): Promise<unknown>}
    output = await captureRaw(() => cmd._run())
  } finally {
    exitCode = process.exitCode
    process.exitCode = previousExitCode
    if (previousEnv === undefined) delete process.env[envKey]
    else process.env[envKey] = previousEnv
  }

  const mode = activation === 'flag' ? '--json' : `${envKey}=json`
  if (output.stdout === '') {
    expect.fail(`expected one JSON document on stdout under ${mode}, but nothing was printed. oclif prints nothing when run() returns a falsy value (undefined, null, false, 0, '')`)
  }

  // JSON serialization escapes ESC, so colorized values show up as the text `\u001b[`; also
  // match a raw ESC in case something wrote to stdout directly.
  // eslint-disable-next-line no-control-regex
  if (/\u001B\[|\\u001b\[/i.test(output.stdout)) {
    expect.fail(`stdout under ${mode} contains ANSI escape codes; --json values must not be colorized:\n${JSON.stringify(output.stdout)}`)
  }

  let json: T
  try {
    json = JSON.parse(output.stdout)
  } catch {
    expect.fail(`expected stdout to be exactly one JSON document under ${mode}, got:\n${output.stdout}`)
  }

  return {exitCode, json, ...output}
}

/**
 * Run a command under both JSON activation paths (`--json` and `HEROKU_CONTENT_TYPE=json`),
 * assert it succeeded, assert both paths produce the same document, and compare it to the
 * stored snapshot for the current test.
 *
 * Call from inside a mocha `it` using `function () {}` so `this` is the test context:
 *
 *   it('lists regions', async function () {
 *     await expectJsonSnapshot(this, Regions, ['--common'])
 *   })
 *
 * The command runs twice, so stubs are called twice; don't combine with `calledOnce` checks.
 * Use `runCommandJson` for error cases.
 */
export async function expectJsonSnapshot<T = unknown>(
  ctx: Context,
  Cmd: CommandClass,
  args: string[] = [],
  {config, name}: JsonSnapshotOptions = {},
): Promise<JsonRunResult<T>> {
  const viaFlag = await runCommandJson<T>(Cmd, args, {activation: 'flag', config})
  const failed = `command failed under --json, so its output is an error document, not a snapshot. Fix the fixture or use runCommandJson for error cases. Output:\n${viaFlag.stdout}`
  expect(viaFlag.exitCode, failed).to.equal(undefined)
  const viaEnv = await runCommandJson<T>(Cmd, args, {activation: 'env', config})
  expect(viaEnv.json, 'HEROKU_CONTENT_TYPE=json and --json produce different documents').to.deep.equal(viaFlag.json)
  expect(viaEnv.exitCode, 'HEROKU_CONTENT_TYPE=json and --json exit differently').to.equal(viaFlag.exitCode)
  matchJsonSnapshot(ctx, viaFlag.json, {name})
  return viaFlag
}

/** Snapshot keys used so far in this process, per snapshot file, to catch collisions. */
const usedKeys = new Map<string, Set<string>>()

/**
 * Compare a value to the stored snapshot for the current mocha test.
 *
 * Snapshots live next to the test file in `__snapshots__/<test file>.json`, keyed by the
 * test's full title (plus `name`, if given). Set `UPDATE_SNAPSHOTS=1` to write or overwrite
 * them. A missing snapshot is written automatically locally but fails when `CI` is set, so CI
 * never silently accepts a new contract; `UPDATE_SNAPSHOTS` is refused in CI for the same reason.
 */
export function matchJsonSnapshot(ctx: Context, value: unknown, {name}: {name?: string} = {}): void {
  const {test} = ctx
  if (!test?.file) throw new Error('matchJsonSnapshot must be called from inside a mocha test (use `function () {}`, not an arrow function)')

  const key = name ? `${test.fullTitle()} [${name}]` : test.fullTitle()
  const file = snapshotPath(test.file)
  const keys = usedKeys.get(file) ?? new Set<string>()
  usedKeys.set(file, keys)
  if (keys.has(key)) {
    expect.fail(`snapshot key "${key}" was already used in this run. Give each snapshot in a test a distinct \`name\`, and give tests distinct titles`)
  }

  keys.add(key)

  const ci = isCI()
  const update = isTruthyEnv(process.env.UPDATE_SNAPSHOTS)
  if (update && ci) expect.fail('UPDATE_SNAPSHOTS is not allowed in CI; update snapshots locally and commit them')

  const snapshots = readSnapshots(file)
  // Round-trip so `undefined` fields and non-JSON values compare the way they serialize.
  const actual = JSON.parse(JSON.stringify(value) ?? 'null')

  if (update || !(key in snapshots)) {
    if (!update && ci) {
      expect.fail(`missing --json snapshot "${key}" in ${path.relative(process.cwd(), file)}; run the test locally with UPDATE_SNAPSHOTS=1 and commit the snapshot`)
    }

    snapshots[key] = actual
    writeSnapshots(file, snapshots)
    return
  }

  expect(actual, `--json output changed for "${key}". If intentional, rerun with UPDATE_SNAPSHOTS=1 and describe the change in the PR (test/helpers/json-snapshot.md)`).to.deep.equal(snapshots[key])
}

/** Insert `--json` before any `--`, since oclif ignores flags after it. */
function withJsonFlag(args: string[]): string[] {
  const passThrough = args.indexOf('--')
  return passThrough === -1 ? [...args, '--json'] : [...args.slice(0, passThrough), '--json', ...args.slice(passThrough)]
}

/** Capture stdout/stderr without stripping ANSI codes, so colorized JSON values are visible. */
async function captureRaw(fn: () => Promise<unknown>): Promise<{stderr: string, stdout: string}> {
  const chunks = {stderr: [] as string[], stdout: [] as string[]}
  const originals = {stderr: process.stderr.write, stdout: process.stdout.write}
  const mock = (stream: 'stderr' | 'stdout') => ((chunk: string | Uint8Array, encoding?: unknown, cb?: unknown) => {
    chunks[stream].push(chunk.toString())
    const done = typeof encoding === 'function' ? encoding : cb
    if (typeof done === 'function') done()
    return true
  }) as typeof process.stdout.write
  process.stdout.write = mock('stdout')
  process.stderr.write = mock('stderr')
  try {
    await fn()
  } finally {
    process.stdout.write = originals.stdout
    process.stderr.write = originals.stderr
  }

  return {stderr: chunks.stderr.join(''), stdout: chunks.stdout.join('')}
}

function isTruthyEnv(value: string | undefined): boolean {
  return value !== undefined && !['', '0', 'false'].includes(value.toLowerCase())
}

function isCI(): boolean {
  return isTruthyEnv(process.env.CI)
}

function snapshotPath(testFile: string): string {
  return path.join(path.dirname(testFile), '__snapshots__', `${path.basename(testFile)}.json`)
}

function readSnapshots(file: string): Record<string, unknown> {
  if (!fs.existsSync(file)) return {}
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeSnapshots(file: string, snapshots: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(file), {recursive: true})
  const sorted = Object.fromEntries(Object.keys(snapshots).sort().map(k => [k, snapshots[k]]))
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n')
}
