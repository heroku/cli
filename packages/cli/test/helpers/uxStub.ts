import {ux} from '@oclif/core'
import stripAnsi from 'strip-ansi'

export function stubUxActionStart() {
  const originalStart = ux.action.start
  ux.action.start = (message: string) => {
    process.stderr.write(`${stripAnsi(message)}... `)
  }

  const originalStop = ux.action.stop
  ux.action.stop = (messageToWrite = 'done') => {
    process.stderr.write(`${stripAnsi(messageToWrite)}\n`)
  }

  return {
    restore() {
      ux.action.start = originalStart
      ux.action.stop = originalStop
    },
  }
}
