'use strict'

const cmd = require('../../commands/logs')
const cli = require('heroku-cli-util')
const expect = require('unexpected')

describe('logs', () => {
  beforeEach(() => cli.mockConsole())

  it('shows the logs', () => {
    return cmd.run({ app: 'heroku-cli-ci-smoke-test-app', flags: {}, auth: { password: global.apikey } })
      .then(() => expect(cli.stdout, 'to begin with', '20')) // starts with the year
  })
})
