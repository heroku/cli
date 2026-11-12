import {ux} from '@oclif/core/ux'
import ansis from 'ansis'

export function stubUxActionStart() {
  const originalStart = ux.action.start
  ux.action.start = (message: string) => {
    process.stderr.write(`${ansis.strip(message)}... `)
  }

  const originalStop = ux.action.stop
  ux.action.stop = (messageToWrite = 'done') => {
    process.stderr.write(`${ansis.strip(messageToWrite)}\n`)
  }

  return {
    restore() {
      ux.action.start = originalStart
      ux.action.stop = originalStop
    },
  }
}

/**
 * Run `fn` with oclif's real `ux.action` instead of the stub the global test hook installs.
 * Use it for behavior that depends on the real spinner, which buffers stdout and stderr while
 * it runs (for example, an error under --json while a spinner is active).
 */
export async function withRealUxAction<T>(fn: () => Promise<T>): Promise<T> {
  // The stub is an own property; deleting it exposes the real prototype methods.
  const action = ux.action as unknown as Record<string, unknown>
  const stubs = {start: action.start, stop: action.stop}
  const writes = {stderr: process.stderr.write, stdout: process.stdout.write}
  delete action.start
  delete action.stop
  try {
    return await fn()
  } finally {
    // A spinner left running keeps buffering output, and stopping it restores whatever
    // write functions were in place when it started (possibly a capture helper's). Stop it,
    // then put back the streams this helper started with.
    ux.action.stop('')
    process.stdout.write = writes.stdout
    process.stderr.write = writes.stderr
    Object.assign(action, stubs)
  }
}
