'use strict'
/* globals beforeEach */

const cli = require('@heroku/heroku-cli-util')
const cmd = require('../../../commands/access/index')[0]
const {expect} = require('chai')

describe('access', () => {
  beforeEach(() => cli.mockConsole())

  it('runs a command', () => {
    return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {}, auth: {password: global.apikey}})
      .then(() => expect(cli.stdout).to.contain('heroku-cli@salesforce.com'))
  })
})
