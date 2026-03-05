import {getConfig} from './testInstances.js'
import {Command} from '@heroku-cli/command'
import {Interfaces} from '@oclif/core'

type CmdConstructorParams = ConstructorParameters<typeof Command>
export type GenericCmd = new (...args: CmdConstructorParams) => Command

type CaptureOptions = {
  print?: boolean
  stripAnsi?: boolean
}

type CaptureResult<T> = {
  error?: Error
  result?: T
  stderr: string
  stdout: string
}

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
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
  const print = captureOpts?.print ?? false
  const shouldStripAnsi = captureOpts?.stripAnsi ?? true

  const originals = {
    stdout: process.stdout.write,
    stderr: process.stderr.write,
  }

  const output = {
    stdout: [] as Array<string | Uint8Array>,
    stderr: [] as Array<string | Uint8Array>,
  }

  const toString = (str: string | Uint8Array) =>
    shouldStripAnsi ? stripAnsi(str.toString()) : str.toString()

  const getStdout = () => output.stdout.map(b => toString(b)).join('')
  const getStderr = () => output.stderr.map(b => toString(b)).join('')

  const mock = (std: 'stdout' | 'stderr') =>
    (str: string | Uint8Array, encoding?: BufferEncoding | ((err?: Error) => void), cb?: (err?: Error) => void) => {
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

  try {
    const conf = loadOpts ? await getConfig(loadOpts) : await getConfig()
    const instance = new CommandClass(argsArray, conf)
    const result = await instance.run() as T

    process.stdout.write = originals.stdout
    process.stderr.write = originals.stderr

    return {
      result,
      stdout: getStdout(),
      stderr: getStderr(),
    }
  } catch (error) {
    process.stdout.write = originals.stdout
    process.stderr.write = originals.stderr

    return {
      error: error as Error,
      stdout: getStdout(),
      stderr: getStderr(),
    }
  }
}
