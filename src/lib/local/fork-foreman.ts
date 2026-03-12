import {ux} from '@oclif/core'
import {fork as forkChildProcess} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import {fileURLToPath} from 'url'

// depending if this is being ran before or after compilation
// we need to check for `.ts` and `.js` extensions and use
// the appropriate one.
function getForemanScriptPath() {
  const file = 'run-foreman'
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const withCjsExtension = path.join(__dirname, file + '.cjs')
  const withJsExtension = path.join(__dirname, file + '.js')
  const withTsExtension = path.join(__dirname, file + '.ts')

  if (fs.existsSync(withCjsExtension)) {
    return withCjsExtension
  }

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
    nf.on('exit', (code: number) => {
      if (code !== 0) ux.exit(code)
      resolve()
    })
  })
}
