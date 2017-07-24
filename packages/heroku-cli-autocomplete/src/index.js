// @flow

import fs from 'fs-extra'
import path from 'path'

export const topic = {
  name: 'hello',
  description: 'says hello (example plugin)'
}

let dir = path.join(__dirname, 'commands')
export const commands = fs.readdirSync(dir)
  .filter(f => path.extname(f) === '.js' && !f.endsWith('.test.js'))
  // $FlowFixMe
  .map(f => require('./commands/' + f).default)
