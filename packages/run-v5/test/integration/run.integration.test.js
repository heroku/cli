'use strict'
/* globals beforeEach */

const cli = require('heroku-cli-util')
const cmd = require('../../commands/run')
const {expect} = require('chai')
const StdOutFixture = require('fixture-stdout')
const assertExit = require('../assert_exit')

describe('run', () => {
  beforeEach(() => cli.mockConsole())

  it('runs a command', () => {
    let stdout = ''
    let fixture = new StdOutFixture()
    fixture.capture(s => {
      stdout += s
    })
    return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {size: 'private-s'}, auth: {password: global.apikey}, args: ['echo', '1', '2', '3']})
      .then(() => fixture.release())
      .then(() => expect(stdout).to.contain('1 2 3'))
  })

  it('runs a command with spaces', () => {
    let stdout = ''
    let fixture = new StdOutFixture()
    fixture.capture(s => {
      stdout += s
    })
    return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {size: 'private-s'}, auth: {password: global.apikey}, args: ['ruby', '-e', 'puts ARGV[0]', '{"foo": "bar"} ']})
      .then(() => fixture.release())
      .then(() => expect(stdout).to.contain('{"foo": "bar"} '))
  })

  it('runs a command with quotes', () => {
    let stdout = ''
    let fixture = new StdOutFixture()
    fixture.capture(s => {
      stdout += s
    })
    return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {size: 'private-s'}, auth: {password: global.apikey}, args: ['ruby', '-e', 'puts ARGV[0]', '{"foo":"bar"}']})
      .then(() => fixture.release())
      .then(() => expect(stdout).to.contain('{"foo":"bar"}'))
  })

  it('runs a command with env vars', () => {
    let stdout = ''
    let fixture = new StdOutFixture()
    fixture.capture(s => {
      stdout += s
    })
    return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {size: 'private-s', env: 'FOO=bar'}, auth: {password: global.apikey}, args: ['env']})
      .then(() => fixture.release())
      .then(() => expect(stdout).to.contain('FOO=bar'))
  })

  it('gets 127 status for invalid command', () => {
    cli.exit.mock()
    return assertExit(127, cmd.run({
      app: 'heroku-cli-ci-smoke-test-app',
      flags: {'exit-code': true},
      auth: {password: global.apikey},
      args: ['invalid-command']}))
  })
})
