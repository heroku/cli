import {ux} from '@oclif/core'
import stripAnsi from 'strip-ansi'

// Strip ANSI codes and Heroku CLI emoji icons for consistent test output
// Icons: ⬢ (app), ⛁ (database/config var), ▸ (warning), etc.
function stripAnsiAndIcons(str: string): string {
  return stripAnsi(str).replace(/[⬢⛁▸›]/g, '').replace(/\s+/g, ' ').trim()
}

export function stubUxActionStart() {
  const originalStart = ux.action.start
  ux.action.start = (message: string) => {
    process.stderr.write(`${stripAnsiAndIcons(message)}... `)
  }

  const originalStop = ux.action.stop
  ux.action.stop = (messageToWrite = 'done') => {
    process.stderr.write(`${stripAnsiAndIcons(messageToWrite)}\n`)
  }

  return {
    restore() {
      ux.action.start = originalStart
      ux.action.stop = originalStop
    },
  }
}
