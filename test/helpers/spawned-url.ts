import type {ChildProcess} from 'node:child_process'

/**
 * Whether the arguments `open` passed to `child_process.spawn` include `url`.
 *
 * On macOS and Linux the URL is passed as-is. On Windows, `open` passes a
 * base64-encoded (UTF-16LE) PowerShell command instead, whose exact text
 * changes between `open` versions, so decode it rather than comparing bytes.
 */
export function spawnArgsInclude(args: readonly string[], url: string): boolean {
  return args.some(arg => arg.includes(url) || Buffer.from(arg, 'base64').toString('utf16le').includes(url))
}

/**
 * A stand-in for the browser launcher `child_process.spawn` returns, for stubbing `spawn`.
 *
 * `open` resolves once the launcher emits 'spawn', and on Windows (since open 11.0.4) only after
 * PowerShell also emits 'close', so this emits both, with exit code 0. A fake that never closes
 * makes `open` hang on Windows until the mocha timeout.
 */
export function fakeLauncher(): ChildProcess {
  return {
    off() {},
    on() {},
    once(event: string, cb: CallableFunction) {
      if (event === 'spawn') cb()
      if (event === 'close') cb(0)
    },
    unref() {},
  } as unknown as ChildProcess
}
