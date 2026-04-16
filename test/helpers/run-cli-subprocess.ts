import * as childProcess from 'node:child_process'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cliRoot = path.join(__dirname, '../..')
const bin = path.join(cliRoot, 'bin/run')

export interface RunCliResult {
  exitCode: number
  signal?: string
  stderr: string
  stdout: string
}

/**
 * Run the CLI as a subprocess. Use for integration tests that need to capture
 * real stdout/stderr. Uses spawnSync so output is reliably captured under
 * mocha (execa's async spawn was receiving SIGTERM in this environment).
 * Passes process.env so HEROKU_API_KEY is available when set.
 */
export function runCliSubprocess(
  args: string[],
  opts?: {env?: NodeJS.ProcessEnv; timeout?: number},
): RunCliResult {
  const env = {...process.env, ...opts?.env}
  const result = childProcess.spawnSync(process.execPath, [bin, ...args], {
    cwd: cliRoot,
    encoding: 'utf8',
    env,
    timeout: opts?.timeout ?? 60_000,
  })
  return {
    exitCode: result.status ?? -1,
    signal: result.signal ?? undefined,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
  }
}
