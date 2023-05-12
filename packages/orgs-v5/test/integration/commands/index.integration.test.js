'use strict'
/* globals after before beforeEach nock */

const cli = require('heroku-cli-util')
const cmd = require('../../../commands/access/index')[0]
const {expect} = require('chai')

nock.enableNetConnect()

describe('access', () => {
  before(() => nock.enableNetConnect())

  after(() => nock.disableNetConnect())

  beforeEach(() => cli.mockConsole())

  it('runs a command', () => {
    return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {}, auth: {password: global.apikey}})
      .then(() => expect(cli.stdout).to.contain('heroku-cli@salesforce.com'))
  })
})
