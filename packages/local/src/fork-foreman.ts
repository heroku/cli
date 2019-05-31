import {fork} from 'child_process'
import * as path from 'path'

export default function (argv: string[]): Promise<undefined> {
  let script = path.join(__dirname, 'run-foreman.js')
  let nf = fork(script, argv, {stdio: 'inherit'})

  return new Promise(resolve => {
    nf.on('exit', function (code: number) {
      if (code !== 0) process.exit(code)
      resolve()
    })
  })
}
