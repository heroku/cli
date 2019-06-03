'use strict'

const cli = require('heroku-cli-util')
const cmd = require('../../commands/run')
const expect = require('unexpected')
const StdOutFixture = require('fixture-stdout')
const assertExit = require('../assert_exit')

describe('run', () => {
  beforeEach(() => cli.mockConsole())

  it('runs a command', async () => {
    let stdout = ''
    let fixture = new StdOutFixture()

    fixture.capture(s => { stdout += s })
    await cmd.run({
      app: 'heroku-run-test-app',
      flags: {},
      auth: { password: global.apikey },
      args: ['echo', '1', '2', '3']
    })
    fixture.release()

    expect(stdout, 'to contain', '1 2 3\n')
  })

  it('runs a command with spaces', async () => {
    let stdout = ''
    let fixture = new StdOutFixture()

    fixture.capture(s => { stdout += s })
    await cmd.run({
      app: 'heroku-run-test-app',
      flags: {},
      auth: { password: global.apikey },
      args: ['ruby', '-e', 'puts ARGV[0]', '{"foo": "bar"} ']
    })
    fixture.release()

    expect(stdout, 'to equal', '{"foo": "bar"} \n')
  })

  it('runs a command with quotes', async () => {
    let stdout = ''
    let fixture = new StdOutFixture()

    fixture.capture(s => { stdout += s })
    await cmd.run({
      app: 'heroku-run-test-app',
      flags: {},
      auth: { password: global.apikey },
      args: ['ruby', '-e', 'puts ARGV[0]', '{"foo":"bar"}']
    })
    fixture.release()

    expect(stdout, 'to equal', '{"foo":"bar"}\n')
  })

  it('runs a command with env vars', async () => {
    let stdout = ''
    let fixture = new StdOutFixture()

    fixture.capture(s => { stdout += s })
    await cmd.run({
      app: 'heroku-run-test-app',
      flags: { env: 'FOO=bar' },
      auth: { password: global.apikey },
      args: ['env']
    })
    fixture.release()

    expect(stdout, 'to contain', 'FOO=bar')
  })

  it('gets 127 status for invalid command', () => {
    cli.exit.mock()
    return assertExit(127, cmd.run({
      app: 'heroku-run-test-app',
      flags: { 'exit-code': true },
      auth: { password: global.apikey },
      args: ['invalid-command'] }))
  })
})
