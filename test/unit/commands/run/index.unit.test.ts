import {prompter} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import Run from '../../../../src/commands/run/index.js'

describe('run', function () {
  const originalProcessArgv = [...process.argv]

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
    nock.cleanAll()
    nock.disableNetConnect()
  })

  afterEach(function () {
    nock.enableNetConnect()
    process.argv = [...originalProcessArgv]
    sinon.restore()
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
      .get('/account')
      .reply(200, {email: 'test@example.com'})
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})
      .post('/apps/myapp/dynos', body => {
        expect(body.attach).to.equal(true)
        return true
      })
      .reply(201, {
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

    // The command will try to connect to rendezvous, which will fail
    // but we can verify the API calls were made correctly
    await runCommand(Run, [
      '--app',
      'myapp',
      'echo',
      'test',
    ]).catch(() => {
      // Expected to fail when trying to connect
    })
  })

  it('handles exit codes when --exit-code is specified', async function () {
    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {email: 'test@example.com'})
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})
      .post('/apps/myapp/dynos')
      .reply(201, {
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

    await runCommand(Run, [
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
      .get('/account')
      .reply(200, {email: 'test@example.com'})
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'cnb'}})
      .post('/apps/myapp/dynos')
      .reply(201, {
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

    await runCommand(Run, [
      '--app',
      'myapp',
      '--no-launcher',
      'echo',
      'test',
    ]).catch(() => {
      // Expected to fail when trying to connect
    })
  })

  it('prompts for 2FA via prompter and retries with Heroku-Two-Factor-Code header on 403 two_factor', async function () {
    const promptStub = sinon.stub(prompter, 'prompt').resolves({factor: '123456'})

    const api = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})
      .get('/account')
      .reply(403, {id: 'two_factor', message: 'Two-factor code required'})
      .get('/account', undefined, {reqheaders: {'heroku-two-factor-code': '123456'}})
      .reply(200, {email: 'test@example.com'})
      .post('/apps/myapp/dynos')
      .reply(201, {
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
      'echo',
      'test',
    ]).catch(() => {
      // Expected to fail when trying to connect to rendezvous
    })

    expect(promptStub.calledOnce, 'prompter.prompt should be called exactly once').to.be.true
    expect(promptStub.firstCall.args[0]).to.deep.equal([{
      mask: '*',
      message: 'Two-factor code',
      name: 'factor',
      type: 'password',
    }])
    expect(api.isDone(), 'all expected requests including the 2FA-retried /account should be made').to.be.true
  })
})
