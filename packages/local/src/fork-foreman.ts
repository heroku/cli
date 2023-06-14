import {fork as forkChildProcess} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// depending if this is being ran before or after compilation
// we need to check for `.ts` and `.js` extensions and use
// the appropriate one.
function getForemanScriptPath() {
  const file = 'run-foreman'
  const withJsExtension = path.join(__dirname, file + '.js')
  const withTsExtension = path.join(__dirname, file + '.ts')

  if (fs.existsSync(withJsExtension)) {
    return withJsExtension
  }

  if (fs.existsSync(withTsExtension)) {
    return withTsExtension
  }

  throw new Error(`Path to ${file} not found`)
}

export function fork(argv: string[]): Promise<void> {
  const script = getForemanScriptPath()
  const nf = forkChildProcess(script, argv, {stdio: 'inherit'})

  return new Promise(resolve => {
    nf.on('exit', function (code: number) {
      if (code !== 0) process.exit(code)
      resolve()
    })
  })
}
