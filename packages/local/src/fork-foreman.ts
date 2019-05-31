import {fork as forkChildProcess} from 'child_process'
import * as path from 'path'

export function fork(argv: string[]): Promise<void> {
  let script = path.join(__dirname, 'run-foreman.js')
  let nf = forkChildProcess(script, argv, {stdio: 'inherit'})

  return new Promise(resolve => {
    nf.on('exit', function (code: number) {
      if (code !== 0) process.exit(code)
      resolve()
    })
  })
}
