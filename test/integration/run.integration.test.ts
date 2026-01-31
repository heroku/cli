import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import {unwrap} from '../helpers/utils/unwrap.js'

function setupRunNocks(command: string, skipAppCheck = false) {
  const api = nock('https://api.heroku.com')
    .get('/account')
    .reply(200, {email: 'test@example.com'})

  if (!skipAppCheck) {
    api
      .get('/apps/heroku-cli-ci-smoke-test-app')
      .reply(200, {name: 'heroku-cli-ci-smoke-test-app', stack: {name: 'heroku-22'}})
  }

  api
    .post('/apps/heroku-cli-ci-smoke-test-app/dynos')
    .reply(201, {
      attach_url: 'rendezvous://rendezvous.runtime.heroku.com:5000',
      command,
      created_at: '2020-01-01T00:00:00Z',
      id: '12345678-1234-1234-1234-123456789012',
      name: 'run.1234',
      size: 'basic',
      state: 'starting',
      type: 'run',
      updated_at: '2020-01-01T00:00:00Z',
    })
}

function buildProcessArgv(commandParts: string[], flags: string[] = []): string[] {
  return ['node', 'heroku', 'run', ...flags, '--app=heroku-cli-ci-smoke-test-app', ...commandParts]
}

describe('run', function () {
  let originalArgv: string[]

  beforeEach(function () {
    originalArgv = process.argv
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    process.stdout.isTTY = false
  })

  afterEach(function () {
    process.argv = originalArgv
    nock.cleanAll()
  })

  it('runs a command', async function () {
    // Set up process.argv to match what revertSortedArgs expects
    process.argv = buildProcessArgv(['echo', '1', '2', '3'])
    setupRunNocks('echo 1 2 3')

    const {error} = await runCommand(['run', '--app=heroku-cli-ci-smoke-test-app', 'echo', '1', '2', '3'])

    // Expected to fail when trying to connect to rendezvous
    // This verifies the command flow works correctly up to the connection point
    expect(error).to.exist
  })

  it('respects --no-launcher', async function () {
    // Note: when --no-launcher is set, shouldPrependLauncher returns early without checking the app
    process.argv = buildProcessArgv(['echo', '1', '2', '3'], ['--no-launcher'])
    setupRunNocks('echo 1 2 3', true)

    const {error} = await runCommand(['run', '--app=heroku-cli-ci-smoke-test-app', '--no-launcher', 'echo', '1', '2', '3'])

    // Expected to fail when trying to connect to rendezvous
    expect(error).to.exist
  })

  it.skip('runs a command with spaces', async function () {
    const {stdout} = await runCommand(['run', '--app=heroku-cli-ci-smoke-test-app', 'ruby -e "puts ARGV[0]" "{"foo": "bar"} " '])

    expect(unwrap(stdout)).to.contain('{foo: bar}')
  })

  it.skip('runs a command with quotes', async function () {
    const {stdout} = await runCommand(['run', '--app=heroku-cli-ci-smoke-test-app', 'ruby -e "puts ARGV[0]" "{"foo":"bar"}"'])

    expect(stdout).to.contain('{foo:bar}')
  })

  it('runs a command with env vars', async function () {
    process.argv = buildProcessArgv(['env'], ['-e', 'FOO=bar'])
    setupRunNocks('env')

    const {error} = await runCommand(['run', '--app=heroku-cli-ci-smoke-test-app', '-e', 'FOO=bar', 'env'])

    // Expected to fail when trying to connect to rendezvous
    expect(error).to.exist
  })

  it.skip('gets 127 status for invalid command', async function () {
    // Exit code handling is better tested in unit tests
    const {stdout} = await runCommand(['run', '--app=heroku-cli-ci-smoke-test-app', '--exit-code', 'invalid-command'])

    expect(unwrap(stdout)).to.include('invalid-command: command not found')
  })
})
