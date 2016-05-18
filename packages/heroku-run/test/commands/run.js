'use strict'
/* globals describe it beforeEach commands apikey */

const cmd = commands.find(c => c.topic === 'run' && !c.command)
const expect = require('unexpected')
const intercept = require('intercept-stdout')

describe('run', () => {
  let stdout, unhook

  beforeEach(() => {
    unhook = intercept(o => { stdout = o })
  })

  it('runs a command', () => {
    return cmd.run({app: 'heroku-run-test-app', flags: {}, auth: {password: apikey}, args: ['echo', '1', '2', '3']})
    .then(() => unhook())
    .then(() => expect(stdout, 'to equal', '1 2 3\n'))
  })
})
