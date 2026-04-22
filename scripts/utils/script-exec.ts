import {execa, type Options as ExecaOptions, type ResultPromise} from 'execa'

/**
 * Execute a command with args array
 * Logs the command and uses stdio: 'inherit' by default
 */
export function x(command: string, args: string[], options?: ExecaOptions): ResultPromise {
  console.log(`$ ${command} ${args.join(' ')}`)
  return execa(command, args, {
    stdio: 'inherit',
    ...options,
  })
}

/**
 * Execute a shell command (string with interpolation, pipes, etc.)
 * Logs the command and uses stdio: 'inherit' by default
 */
export function shell(command: string, options?: ExecaOptions): ResultPromise {
  console.log(`$ ${command}`)
  return execa(command, {
    shell: true,
    stdio: 'inherit',
    ...options,
  })
}

/**
 * Execute a command and return stdout as string
 * Trims trailing newline
 */
export async function stdout(command: string, args: string[], options?: ExecaOptions): Promise<string> {
  console.log(`$ ${command} ${args.join(' ')}`)
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
