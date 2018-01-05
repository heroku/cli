import { run } from '@cli-engine/engine'
import * as path from 'path'

export function heroku(argv = process.argv.slice(2)) {
  const config = {
    reexecBin: path.join(__dirname, '../bin/run'),
    updateDisabled: 'Update CLI with `npm update -g heroku-cli`',
  }
  run([...process.argv.slice(0, 2), ...argv], config)
}

export default heroku
