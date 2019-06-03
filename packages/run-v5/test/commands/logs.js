'use strict'

const cmd = require('../../commands/logs')
const cli = require('heroku-cli-util')
const expect = require('unexpected')

describe('logs', (done) => {
  beforeEach(() => cli.mockConsole())

  it('shows the logs', async () => {
    await cmd.run({ app: 'heroku-run-test-app', flags: {}, auth: { password: global.apikey } })
    expect(cli.stdout, 'to begin with', '20')
  })
})
