/*
* From https://github.com/oclif/test
*/

import {Config, Errors, Interfaces, run} from '@oclif/core'
import strip from 'strip-ansi'
import makeDebug from 'debug'
import {dirname} from 'node:path'

const debug = makeDebug('oclif-test')

type CaptureOptions = {
  print?: boolean
  stripAnsi?: boolean
  testNodeEnv?: string
}

type CaptureResult<T> = {
  error?: Error & Partial<Errors.CLIError>
  result?: T
  stderr: string
  stdout: string
}

type MockedStdout = typeof process.stdout.write
type MockedStderr = typeof process.stderr.write

function traverseFilePathUntil(filename: string, predicate: (filename: string) => boolean): string {
  let current = filename
  while (!predicate(current)) {
    current = dirname(current)
  }

  return current
}

function findRoot(): string {
  return (
    process.env.OCLIF_TEST_ROOT ??
    import.meta.url ??
    traverseFilePathUntil(
      import.meta.url,
      p => !(p.includes('node_modules') || p.includes('.pnpm') || p.includes('.yarn')),
    )
  )
}

function makeLoadOptions(loadOpts?: Interfaces.LoadOptions): Interfaces.LoadOptions {
  return loadOpts ?? {root: findRoot()}
}

/**
 * Split a string into an array of strings, preserving quoted substrings
 *
 * @example
 * splitString('foo bar --name "foo"') // ['foo bar', '--name', 'foo']
 * splitString('foo bar --name "foo bar"') // ['foo bar', '--name', 'foo bar']
 * splitString('foo bar --name="foo bar"') // ['foo bar', '--name=foo bar']
 * splitString('foo bar --name=foo bar') // ['foo bar', '--name=foo', 'bar']
 *
 * @param str input string
 * @returns array of strings with quotes removed
 */
function splitString(str: string): string[] {
  return (str.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []).map(s => s.replaceAll(/^"|"$|(?<==)"/g, ''))
}

/**
 * Capture the stderr and stdout output of a function
 * @param fn async function to run
 * @param opts options
 *  - print: Whether to print the output to the console
 *  - stripAnsi: Whether to strip ANSI codes from the output
 * @returns {Promise<CaptureResult<T>>} Captured output
 *   - error: Error object if the function throws an error
 *   - result: Result of the function if it returns a value and succeeds
 *   - stderr: Captured stderr output
 *   - stdout: Captured stdout output
 */
export async function captureOutput<T>(fn: () => Promise<unknown>, opts?: CaptureOptions): Promise<CaptureResult<T>> {
  const print = opts?.print ?? false
  const stripAnsi = opts?.stripAnsi ?? true
  const testNodeEnv = opts?.testNodeEnv || 'test'

  const originals = {
    NODE_ENV: process.env.NODE_ENV,
    stderr: process.stderr.write,
    stdout: process.stdout.write,
  }

  const output: Record<'stderr' | 'stdout', Array<string | Uint8Array>> = {
    stderr: [],
    stdout: [],
  }

  const toString = (str: string | Uint8Array): string => (stripAnsi ? strip(str.toString()) : str.toString())
  const getStderr = (): string => output.stderr.map(b => toString(b)).join('')
  const getStdout = (): string => output.stdout.map(b => toString(b)).join('')

  const mock =
    (std: 'stderr' | 'stdout'): MockedStderr | MockedStdout =>
      (str: string | Uint8Array, encoding?: ((err?: Error) => void) | BufferEncoding, cb?: (err?: Error) => void) => {
        output[std].push(str)

        if (print) {
          if (encoding !== null && typeof encoding === 'function') {
            cb = encoding
            encoding = undefined
          }

          originals[std].apply(process[std], [str, encoding, cb])
        } else if (typeof cb === 'function') cb()

        return true
      }

  process.stdout.write = mock('stdout')
  process.stderr.write = mock('stderr')
  process.env.NODE_ENV = testNodeEnv

  try {
    const result = await fn()
    return {
      result: result as T,
      stderr: getStderr(),
      stdout: getStdout(),
    }
  } catch (error) {
    return {
      ...(error instanceof Errors.CLIError && {error: Object.assign(error, {message: toString(error.message)})}),
      ...(error instanceof Error && {error: Object.assign(error, {message: toString(error.message)})}),
      stderr: getStderr(),
      stdout: getStdout(),
    }
  } finally {
    process.stderr.write = originals.stderr
    process.stdout.write = originals.stdout
    process.env.NODE_ENV = originals.NODE_ENV
  }
}

/**
 * Capture the stderr and stdout output of a command in your CLI
 * @param args Command arguments, e.g. `['my:command', '--flag']` or `'my:command --flag'`
 * @param loadOpts options for loading oclif `Config`
 * @param captureOpts options for capturing the output
 *  - print: Whether to print the output to the console
 *  - stripAnsi: Whether to strip ANSI codes from the output
 * @returns {Promise<CaptureResult<T>>} Captured output
 *   - error: Error object if the command throws an error
 *   - result: Result of the command if it returns a value and succeeds
 *   - stderr: Captured stderr output
 *   - stdout: Captured stdout output
 */
export async function runCommand<T>(
  args: string | string[],
  loadOpts?: Interfaces.LoadOptions,
  captureOpts?: CaptureOptions,
): Promise<CaptureResult<T>> {
  const loadOptions = makeLoadOptions(loadOpts)
  const argsArray = splitString((Array.isArray(args) ? args : [args]).join(' '))

  const [id, ...rest] = argsArray
  const finalArgs = id === '.' ? rest : argsArray

  debug('loadOpts: %O', loadOptions)
  debug('args: %O', finalArgs)

  return captureOutput<T>(async () => run(finalArgs, loadOptions), captureOpts)
}

/**
 * Capture the stderr and stdout output of a hook in your CLI
 * @param hook Hook name
 * @param options options to pass to the hook
 * @param loadOpts options for loading oclif `Config`
 * @param captureOpts options for capturing the output
 *  - print: Whether to print the output to the console
 *  - stripAnsi: Whether to strip ANSI codes from the output
 * @returns {Promise<CaptureResult<T>>} Captured output
 *   - error: Error object if the hook throws an error
 *   - result: Result of the hook if it returns a value and succeeds
 *   - stderr: Captured stderr output
 *   - stdout: Captured stdout output
 */
export async function runHook<T>(
  hook: string,
  options: Record<string, unknown>,
  loadOpts?: Interfaces.LoadOptions,
  captureOpts?: CaptureOptions,
): Promise<CaptureResult<T>> {
  const loadOptions = makeLoadOptions(loadOpts)

  debug('loadOpts: %O', loadOptions)

  return captureOutput<T>(async () => {
    const config = await Config.load(loadOptions)
    return config.runHook(hook, options)
  }, captureOpts)
}
