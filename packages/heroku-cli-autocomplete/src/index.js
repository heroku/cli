// @flow

import fs from 'fs-extra'
import path from 'path'

export const topic = {
  name: 'ac',
  description: 'manage cli autocompletion',
  hidden: true
}

let dir = path.join(__dirname, 'commands')
export const commands = fs.readdirSync(dir)
  .filter(f => path.extname(f) === '.js' && !f.endsWith('.test.js'))
  // $FlowFixMe
  .map(f => require('./commands/' + f).default)
