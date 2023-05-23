'use strict'
/* globals beforeEach */

const cmd = require('../../commands/logs')
const cli = require('heroku-cli-util')
const {expect} = require('chai')
const {describeAcceptance} = require('../test-helper')

describeAcceptance('logs', () => {
  beforeEach(() => cli.mockConsole())

  it('shows the logs', () => {
    return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {}, auth: {password: global.apikey}})
      .then(() => expect(cli.stdout.startsWith('20')).to.equal(true, 'starts with the year'))
  })
})
