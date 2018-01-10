import * as klaw from 'klaw-sync'
import * as path from 'path'

export const topics = [
  {
    name: 'autocomplete',
    description: 'manage cli autocompletion',
    // hide until public release
    hidden: true,
  },
]

export const commands = klaw(path.join(__dirname, 'commands'), { nodir: true })
  .filter((f: any) => f.path.endsWith('.js'))
  .filter((f: any) => !f.path.endsWith('.test.js'))
  .filter((f: any) => f.path !== __filename)
  .map((f: any) => require(f.path))
