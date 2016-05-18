'use strict'
/* globals describe it beforeEach commands apikey */

const cmd = commands.find(c => c.topic === 'run' && c.command === 'detached')
const expect = require('unexpected')
const cli = require('heroku-cli-util')

describe('run', () => {
  beforeEach(() => cli.mockConsole())

  it('runs a command', () => {
    return cmd.run({app: 'heroku-run-test-app', flags: {}, auth: {password: apikey}, args: ['echo', '1', '2', '3']})
    .then(() => expect(cli.stdout, 'to begin with', 'Run heroku logs --app heroku-run-test-app --dyno'))
  })
})
