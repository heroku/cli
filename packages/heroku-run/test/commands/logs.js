'use strict'
/* globals describe it beforeEach commands apikey */

const cmd = commands.find(c => c.topic === 'logs' && !c.command)
const cli = require('heroku-cli-util')
const expect = require('unexpected')

describe('logs', () => {
  beforeEach(() => cli.mockConsole())

  it('shows the logs', () => {
    return cmd.run({app: 'heroku-run-test-app', flags: {}, auth: apikey})
    .then(() => expect(cli.stdout, 'to begin with', '20')) // starts with the year
  })
})
