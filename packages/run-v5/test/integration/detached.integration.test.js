'use strict'
/* globals beforeEach */

const cmd = require('../../commands/run/detached')
const {expect} = require('chai')
const cli = require('heroku-cli-util')

describe('run:detached', () => {
  beforeEach(() => cli.mockConsole())

  it('runs a command', () => {
    return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {}, auth: {password: global.apikey}, args: ['echo', '1', '2', '3']})
      .then(() => expect(cli.stdout.startsWith('Run heroku logs --app heroku-cli-ci-smoke-test-app --dyno')).to.equal(true))
  })
})
