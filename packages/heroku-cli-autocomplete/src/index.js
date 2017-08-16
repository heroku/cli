// @flow

import klaw from 'klaw-sync'
import path from 'path'

export const topics = [
  {
    name: 'autocomplete',
    description: 'manage cli autocompletion',
    hidden: true
  }]

export const commands = klaw(path.join(__dirname, 'commands'), {nodir: true})
  .filter(f => f.path.endsWith('.js'))
  .filter(f => !f.path.endsWith('.test.js'))
  .filter(f => f.path !== __filename)
  .map(f => require(f.path))
