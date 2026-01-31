import {ux} from '@oclif/core'
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
