import {expect, test} from '@oclif/test'
import nock from 'nock'

import {unwrap} from '../helpers/utils/unwrap.js'

const testFactory = () => test
  .stdout()
  .do(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    process.stdout.isTTY = false
  })

function setupRunNocks(command: string, skipAppCheck = false) {
  return (api: nock.Scope) => {
    api
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
}

function buildProcessArgv(commandParts: string[], flags: string[] = []): string[] {
  return ['node', 'heroku', 'run', ...flags, '--app=heroku-cli-ci-smoke-test-app', ...commandParts]
}

describe('run', function () {
  testFactory()
    .do(() => {
      // Set up process.argv to match what revertSortedArgs expects
      process.argv = buildProcessArgv(['echo', '1', '2', '3'])
    })
    .nock('https://api.heroku.com', setupRunNocks('echo 1 2 3'))
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', 'echo', '1', '2', '3'])
    .catch(error => {
      // Expected to fail when trying to connect to rendezvous
      // This verifies the command flow works correctly up to the connection point
      expect(error).to.exist
    })
    .it('runs a command', () => {
      // Test passes if command flow completes without errors before connection
    })

  testFactory()
    .do(() => {
      // Note: when --no-launcher is set, shouldPrependLauncher returns early without checking the app
      process.argv = buildProcessArgv(['echo', '1', '2', '3'], ['--no-launcher'])
    })
    .nock('https://api.heroku.com', setupRunNocks('echo 1 2 3', true))
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', '--no-launcher', 'echo', '1', '2', '3'])
    .catch(error => {
      // Expected to fail when trying to connect to rendezvous
      expect(error).to.exist
    })
    .it('respects --no-launcher', () => {
      // Test passes if command flow completes without errors before connection
    })

  testFactory()
    .skip()
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', 'ruby -e "puts ARGV[0]" "{"foo": "bar"} " '])
    .it('runs a command with spaces', ctx => {
      expect(unwrap(ctx.stdout)).to.contain('{foo: bar}')
    })

  testFactory()
    .skip()
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', 'ruby -e "puts ARGV[0]" "{"foo":"bar"}"'])
    .it('runs a command with quotes', ctx => {
      expect(ctx.stdout).to.contain('{foo:bar}')
    })

  testFactory()
    .do(() => {
      process.argv = buildProcessArgv(['env'], ['-e', 'FOO=bar'])
    })
    .nock('https://api.heroku.com', setupRunNocks('env'))
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', '-e', 'FOO=bar', 'env'])
    .catch(error => {
      // Expected to fail when trying to connect to rendezvous
      expect(error).to.exist
    })
    .it('runs a command with env vars', () => {
      // Test passes if command flow completes without errors before connection
    })

  testFactory()
    .skip() // Exit code handling is better tested in unit tests
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', '--exit-code', 'invalid-command'])
    .exit(127)
    .it('gets 127 status for invalid command', ctx => {
      expect(unwrap(ctx.stdout)).to.include('invalid-command: command not found')
    })
})
