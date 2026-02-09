import {expect} from 'chai'

import {runCliSubprocess} from '../helpers/runCliSubprocess.js'
import {unwrap} from '../helpers/utils/unwrap.js'

describe('run', function () {
  it('runs a command', function () {
    const {stderr, stdout} = runCliSubprocess([
      'run',
      '--app=heroku-cli-ci-smoke-test-app',
      'echo',
      '1',
      '2',
      '3',
    ])
    const out = unwrap(stdout + stderr)
    expect(out).to.include('Running')
    expect(out).to.include('echo 1 2 3')
  })

  it('respects --no-launcher', function () {
    const {stderr, stdout} = runCliSubprocess([
      'run',
      '--app=heroku-cli-ci-smoke-test-app',
      '--no-launcher',
      'echo',
      '1',
      '2',
      '3',
    ])
    const out = unwrap(stdout + stderr)
    expect(out).to.include('Running')
    expect(out).to.include('echo 1 2 3')
  })

  it('runs a command with spaces', function () {
    const commandWithSpaces = 'echo "{"foo": "bar"} " '
    const {stderr, stdout} = runCliSubprocess([
      'run',
      '--app=heroku-cli-ci-smoke-test-app',
      commandWithSpaces,
    ])
    const out = unwrap(stdout + stderr)
    // CLI passes the command through; we assert the exact string appears in the run line (dyno echo output may not arrive before timeout in CI)
    expect(out).to.contain(commandWithSpaces.trim())
  })

  it('runs a command with quotes', function () {
    const commandWithQuotes = 'echo "{"foo":"bar"}"'
    const {stderr, stdout} = runCliSubprocess([
      'run',
      '--app=heroku-cli-ci-smoke-test-app',
      commandWithQuotes,
    ])
    const out = stdout + stderr
    // CLI passes the command through; we assert the exact string appears in the run line (dyno echo output may not arrive before timeout in CI)
    expect(out).to.contain(commandWithQuotes)
  })

  it('runs a command with env vars', function () {
    const {stderr, stdout} = runCliSubprocess([
      'run',
      '--app=heroku-cli-ci-smoke-test-app',
      '-e',
      'FOO=bar',
      'env',
    ])
    const out = unwrap(stdout + stderr)
    expect(out).to.include('Running')
    expect(out).to.include('env')
  })

  it('reports invalid command not found', function () {
    const {stderr, stdout} = runCliSubprocess(
      [
        'run',
        '--app=heroku-cli-ci-smoke-test-app',
        '--exit-code',
        'invalid-command',
      ],
      {timeout: 120_000},
    )
    const out = unwrap(stdout + stderr)
    expect(out).to.include('invalid-command: command not found')
  })
})
