import type {OclifError} from '@oclif/core/interfaces'

import {Interfaces} from '@oclif/core'
import ansis from 'ansis'

import {getConfig} from './testInstances.js'

// Accept any command class (including those with protected constructors)
// Use a broader type to bypass visibility checks while maintaining instance type safety
// The run() return type matches oclif's Command.run(): Promise<any>

interface CommandInstance {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  run(): Promise<any>
}

export type GenericCmd =
  | {new(argv: string[], config: Interfaces.Config): CommandInstance}
  | {prototype: CommandInstance}

type CaptureOptions = {
  print?: boolean
  stripAnsi?: boolean
}

type CaptureResult<T> = {
  error?: Error & Partial<OclifError>
  result?: T
  stderr: string
  stdout: string
}

/**
 * Internal helper to capture stdout/stderr during function execution
 */
function withCapturedOutput<T>(
  fn: () => Promise<T>,
  options: {print?: boolean; stripAnsi?: boolean} = {},
): Promise<{error?: Error; result: T; stderr: string; stdout: string}> {
  const {print = false, stripAnsi: shouldStripAnsi = true} = options

  const originals = {
    stderr: process.stderr.write,
    stdout: process.stdout.write,
  }

  const output = {
    stderr: [] as Array<Uint8Array | string>,
    stdout: [] as Array<Uint8Array | string>,
  }

  const toString = (str: Uint8Array | string) =>
    shouldStripAnsi ? ansis.strip(str.toString()) : str.toString()

  const getStdout = () => output.stdout.map(b => toString(b)).join('')
  const getStderr = () => output.stderr.map(b => toString(b)).join('')

  const mock = (std: 'stderr' | 'stdout') =>
    (str: Uint8Array | string, encoding?: ((err?: Error | null) => void) | BufferEncoding, cb?: (err?: Error | null) => void) => {
      output[std].push(str)
      if (print) {
        originals[std].call(process[std], str, encoding as BufferEncoding, cb)
      }

      if (typeof encoding === 'function') {
        encoding()
      } else if (cb) {
        cb()
      }

      return true
    }

  process.stdout.write = mock('stdout') as typeof process.stdout.write
  process.stderr.write = mock('stderr') as typeof process.stderr.write

  return fn()
    .then(result => ({
      error: undefined,
      result,
      stderr: getStderr(),
      stdout: getStdout(),
    }))
    .catch(error => ({
      error,
      result: undefined as T,
      stderr: getStderr(),
      stdout: getStdout(),
    }))
    .finally(() => {
      process.stdout.write = originals.stdout
      process.stderr.write = originals.stderr
    })
}

/**
 * Run a command directly with an interface matching @oclif/test's runCommand.
 * This version runs the command class directly (from src/) instead of using
 * dynamic loading, which ensures c8 coverage tracking works properly.
 *
 * @param CommandClass - The command class to run
 * @param args - Command arguments as a string or array
 * @param loadOpts - Options for loading oclif Config
 * @param captureOpts - Options for capturing output
 * @returns Captured output including stdout, stderr, result, and any error
 */
export async function runCommand<T = unknown>(
  CommandClass: GenericCmd,
  args: string | string[] = [],
  loadOpts?: Interfaces.LoadOptions,
  captureOpts?: CaptureOptions,
): Promise<CaptureResult<T>> {
  const argsArray = typeof args === 'string' ? args.split(' ') : args

  const conf = loadOpts ? await getConfig(loadOpts) : await getConfig()
  // Cast to constructor type to handle protected constructors
  const Ctor = CommandClass as {new(argv: string[], config: Interfaces.Config): CommandInstance}
  const instance = new Ctor(argsArray, conf)

  const {error, result, stderr, stdout} = await withCapturedOutput(
    () => instance.run() as Promise<T>,
    captureOpts,
  )

  if (error) {
    return {
      error: error as Error,
      stderr,
      stdout,
    }
  }

  return {result, stderr, stdout}
}

/**
 * Capture stdout/stderr from a function call (for testing library functions, not commands)
 *
 * @param fn - The function to execute while capturing output
 * @returns Object with stdout and stderr strings (ANSI codes stripped)
 */
export async function captureOutput(fn: () => Promise<void> | void): Promise<{stderr: string; stdout: string}> {
  const {stderr, stdout} = await withCapturedOutput(async () => {
    await fn()
  }, {stripAnsi: true})

  return {stderr, stdout}
}
