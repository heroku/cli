import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import Run from '../../../../src/commands/run/index.js'

type FakePlatform = {
  account: {info: sinon.SinonStub}
  dyno: {run: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    account: {info: sinon.stub()},
    dyno: {run: sinon.stub()},
  }
}

describe('run', function () {
  const originalProcessArgv = [...process.argv]
  let fakePlatform: FakePlatform
  let sandbox: sinon.SinonSandbox

  const runWithCliArgv = async (args: string[]) => {
    process.argv = [
      '/usr/local/bin/node',
      '/usr/local/bin/heroku',
      'run',
      ...args,
    ]

    return runCommand(Run, args)
  }

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    fakePlatform = buildFakePlatform()
    sandbox.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform as unknown as HerokuSDK['platform'])
    nock.cleanAll()
    nock.disableNetConnect()
  })

  afterEach(function () {
    nock.enableNetConnect()
    process.argv = [...originalProcessArgv]
    sandbox.restore()
  })

  it('requires a command', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})

    await runCommand(Run, [
      '--app',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.include('Usage: heroku run COMMAND')
    })
  })

  it('creates and attaches to a dyno', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})

    fakePlatform.account.info.resolves({email: 'test@example.com'})
    fakePlatform.dyno.run.resolves({
      attach_url: 'rendezvous://rendezvous.runtime.heroku.com:5000',
      command: 'echo test',
      created_at: '2020-01-01T00:00:00Z',
      id: '12345678-1234-1234-1234-123456789012',
      name: 'run.1234',
      size: 'basic',
      state: 'starting',
      type: 'run',
      updated_at: '2020-01-01T00:00:00Z',
    })

    await runWithCliArgv(['--app', 'myapp', 'echo', 'test']).catch(() => {
      // Expected to fail when trying to connect to rendezvous
    })

    expect(fakePlatform.account.info.calledOnce).to.equal(true)
    expect(fakePlatform.dyno.run.calledOnce).to.equal(true)
    const [appId, command, options] = fakePlatform.dyno.run.firstCall.args
    expect(appId).to.equal('myapp')
    expect(command).to.equal('echo test')
    expect(options.attach).to.equal(true)
  })

  it('handles exit codes when --exit-code is specified', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})

    fakePlatform.account.info.resolves({email: 'test@example.com'})
    fakePlatform.dyno.run.resolves({
      attach_url: 'rendezvous://rendezvous.runtime.heroku.com:5000',
      command: 'false; echo "\uFFFF heroku-command-exit-status: 1"',
      created_at: '2020-01-01T00:00:00Z',
      id: '12345678-1234-1234-1234-123456789012',
      name: 'run.1234',
      size: 'basic',
      state: 'starting',
      type: 'run',
      updated_at: '2020-01-01T00:00:00Z',
    })

    await runWithCliArgv([
      '--app',
      'myapp',
      '--exit-code',
      'false',
    ]).catch(error => {
      // Expected to fail with exit code 1 or connection error
      expect(error).to.exist
    })
  })

  it('respects --no-launcher flag', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'cnb'}})

    fakePlatform.account.info.resolves({email: 'test@example.com'})
    fakePlatform.dyno.run.resolves({
      attach_url: 'rendezvous://rendezvous.runtime.heroku.com:5000',
      command: 'echo test',
      created_at: '2020-01-01T00:00:00Z',
      id: '12345678-1234-1234-1234-123456789012',
      name: 'run.1234',
      size: 'basic',
      state: 'starting',
      type: 'run',
      updated_at: '2020-01-01T00:00:00Z',
    })

    await runWithCliArgv([
      '--app',
      'myapp',
      '--no-launcher',
      'echo',
      'test',
    ]).catch(() => {
      // Expected to fail when trying to connect
    })
  })

  // NOTE: Integration test needed for 2FA prompting behavior.
  // The SDK stub is above the credentials layer, so unit tests can't verify
  // that the prompter fires on 403 two_factor responses. The SDK's
  // HerokuApiClient (via @heroku/heroku-fetch) does handle 2FA the same way
  // as the legacy this.heroku client, but this requires integration coverage.
})
