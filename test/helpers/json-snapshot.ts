import type {Command, Config} from '@oclif/core'
import type {Context} from 'mocha'

import {captureOutput} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import {getConfig} from './test-instances.js'

/**
 * How JSON output is switched on for a run.
 * - `flag`: append `--json` to argv
 * - `env`: set `HEROKU_CONTENT_TYPE=json`
 */
export type JsonActivation = 'env' | 'flag'

export interface JsonRunResult {
  /** process.exitCode after the run (undefined on success) */
  exitCode: number | string | undefined
  /** the parsed JSON document written to stdout */
  json: unknown
  stderr: string
  stdout: string
}

type CommandClass = (new (argv: string[], config: Config) => Command) & Pick<typeof Command, 'run'>

/**
 * Run a command through oclif's real lifecycle (`Command.run`) with JSON output enabled
 * and return the document it wrote to stdout.
 *
 * Unlike `runCommand` from `@heroku-cli/test-utils` (which calls `run()` directly),
 * this exercises the path users hit: oclif serializes `run()`'s return value,
 * suppresses `this.log`, and renders errors as JSON. Fails the test if stdout is
 * not exactly one JSON document, which catches stray `ux.stdout` / `console.log`
 * / `hux.*` writes under `--json`.
 */
export async function runCommandJson(
  Cmd: CommandClass,
  args: string[] = [],
  {activation = 'flag'}: {activation?: JsonActivation} = {},
): Promise<JsonRunResult> {
  const config = await getConfig()
  const argv = activation === 'flag' ? [...args, '--json'] : [...args]
  const envKey = 'HEROKU_CONTENT_TYPE'
  const previousEnv = process.env[envKey]
  const previousExitCode = process.exitCode
  let thrown: unknown

  if (activation === 'env') process.env[envKey] = 'json'
  process.exitCode = undefined

  let output: {stderr: string, stdout: string}
  let exitCode: JsonRunResult['exitCode']
  try {
    output = await captureOutput(async () => {
      try {
        // Command.run is oclif's public entry point: it constructs the command and drives the
        // full lifecycle (init → run → catch → logJson), the same path bin/run takes.
        await Cmd.run(argv, config)
      } catch (error) {
        thrown = error
      }
    })
  } finally {
    exitCode = process.exitCode
    process.exitCode = previousExitCode
    if (previousEnv === undefined) delete process.env[envKey]
    else process.env[envKey] = previousEnv
  }

  if (thrown) throw thrown

  let json: unknown
  try {
    json = JSON.parse(output.stdout)
  } catch {
    expect.fail(`expected stdout to be exactly one JSON document under ${activation === 'flag' ? '--json' : `${envKey}=json`}, got:\n${output.stdout}`)
  }

  return {exitCode, json, ...output}
}

/**
 * Run a command under both JSON activation paths (`--json` and
 * `HEROKU_CONTENT_TYPE=json`), assert they produce the same document, and
 * compare it to the stored snapshot for the current test.
 *
 * Call from inside a mocha `it` using `function () {}` so `this` is the test context:
 *
 *   it('lists regions', async function () {
 *     await expectJsonSnapshot(this, Regions, ['--common'])
 *   })
 */
export async function expectJsonSnapshot(
  ctx: Context,
  Cmd: CommandClass,
  args: string[] = [],
): Promise<JsonRunResult> {
  const viaFlag = await runCommandJson(Cmd, args, {activation: 'flag'})
  const viaEnv = await runCommandJson(Cmd, args, {activation: 'env'})
  expect(viaEnv.json, 'HEROKU_CONTENT_TYPE=json and --json produce different documents').to.deep.equal(viaFlag.json)
  expect(viaEnv.exitCode, 'HEROKU_CONTENT_TYPE=json and --json exit differently').to.equal(viaFlag.exitCode)
  matchJsonSnapshot(ctx, viaFlag.json)
  return viaFlag
}

/**
 * Compare a value to the stored snapshot for the current mocha test.
 *
 * Snapshots live next to the test file in `__snapshots__/<test file>.json`, keyed
 * by the test's full title. Set `UPDATE_SNAPSHOTS=1` to write or overwrite them.
 * A missing snapshot is written automatically locally but fails when `CI` is set,
 * so CI never silently accepts a new contract.
 */
export function matchJsonSnapshot(ctx: Context, value: unknown): void {
  const {test} = ctx
  if (!test?.file) throw new Error('matchJsonSnapshot must be called from inside a mocha test (use `function () {}`, not an arrow function)')

  const key = test.fullTitle()
  const file = snapshotPath(test.file)
  const snapshots = readSnapshots(file)
  const update = process.env.UPDATE_SNAPSHOTS === '1' || process.env.UPDATE_SNAPSHOTS === 'true'
  // Round-trip so `undefined` fields and non-JSON values compare the way they serialize.
  const actual = JSON.parse(JSON.stringify(value) ?? 'null')

  if (update || !(key in snapshots)) {
    if (!update && process.env.CI) {
      expect.fail(`missing --json snapshot "${key}" in ${path.relative(process.cwd(), file)}; run the test locally with UPDATE_SNAPSHOTS=1 and commit the snapshot`)
    }

    snapshots[key] = actual
    writeSnapshots(file, snapshots)
    return
  }

  expect(actual, `--json output changed for "${key}". If intentional, rerun with UPDATE_SNAPSHOTS=1 and describe the change in the PR (test/helpers/json-snapshot.md)`).to.deep.equal(snapshots[key])
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
