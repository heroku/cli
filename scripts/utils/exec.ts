import {execa, type Options as ExecaOptions, type ResultPromise} from 'execa'

// Configuration for command logging
export const config = {
  silent: false,
}

// Log commands before execution
function log(...args: string[]) {
  if (config.silent) return
  console.log(`$ ${args.join(' ')}`)
}

/**
 * Execute a command with args array
 * Uses stdio: 'inherit' by default (logs command, inherits stdio)
 */
export function x(command: string, args: string[], options?: ExecaOptions): ResultPromise {
  const defaultOptions: ExecaOptions = {
    stdio: 'inherit',
    ...options,
  }

  log(command, ...args)
  return execa(command, args, defaultOptions)
}

/**
 * Execute a shell command (string with interpolation, pipes, etc.)
 * Uses stdio: 'inherit' by default
 */
export function shell(command: string, options?: ExecaOptions): ResultPromise {
  const defaultOptions: ExecaOptions = {
    shell: true,
    stdio: 'inherit',
    ...options,
  }

  log(command)
  return execa(command, defaultOptions)
}

/**
 * Execute a command and return stdout as string
 * Trims trailing newline (like qqjs did)
 */
export async function stdout(command: string, args: string[], options?: ExecaOptions): Promise<string> {
  log(command, ...args)
  const result = await execa(command, args, {
    ...options,
    stderr: 'inherit',
    stdin: 'inherit',
    stdout: 'pipe',
  })
  const output = typeof result.stdout === 'string' ? result.stdout : ''
  return output.replace(/\n$/, '')
}

/**
 * Run an async function with error handling
 * Catches errors, logs them, and sets process.exitCode
 */
export async function run<T>(fn: () => Promise<T>): Promise<T | void> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.stack || error.message)
    } else {
      console.error(error)
    }

    process.exitCode = 1
  }
}
