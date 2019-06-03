'use strict'

const cmd = require('../../commands/run/detached')
const expect = require('unexpected')
const cli = require('heroku-cli-util')

describe('run:detached', () => {
  beforeEach(() => cli.mockConsole())

  it('runs a command', async () => {
    await cmd.run({
      app: 'heroku-run-test-app',
      flags: {},
      auth: { password: global.apikey },
      args: ['echo', '1', '2', '3']
    })

    expect(cli.stdout, 'to begin with', 'Run heroku logs --app heroku-run-test-app --dyno')
  })
})
