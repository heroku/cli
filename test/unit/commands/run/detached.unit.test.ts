/* eslint-disable n/no-unsupported-features/node-builtins */

import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import RunDetached from '../../../../src/commands/run/detached.js'

type FakePlatform = {
  dyno: {run: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    dyno: {run: sinon.stub()},
  }
}

describe('run:detached', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    nock.cleanAll()
    nock.disableNetConnect()
  })

  afterEach(function () {
    sinon.restore()
    nock.enableNetConnect()
  })

  it('requires a command', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})

    const {error} = await runCommand(RunDetached, [
      '--app',
      'myapp',
    ])
    expect(error?.message).to.include('Usage: heroku run COMMAND')
  })

  it('creates a detached dyno', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})

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

    const {stderr} = await runCommand(RunDetached, [
      '--app',
      'myapp',
      'echo',
      'test',
    ])
    // The command should output a message about viewing logs
    expect(stderr).to.match(/Run.*heroku logs|Running.*done/)

    expect(fakePlatform.dyno.run.calledOnce).to.equal(true)
    const options = fakePlatform.dyno.run.firstCall.args[2]
    expect(options.attach).to.equal(false)
  })

  it('streams logs when --tail is specified', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})
      .post('/apps/myapp/log-sessions', body => {
        expect(body.dyno).to.equal('run.1234')
        expect(body.tail).to.equal(true)
        return true
      })
      .reply(200, {
        logplex_url: 'https://logs.example.com/logs',
      })

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

    // Mock EventSource for log streaming
    const originalEventSource = globalThis.EventSource
    // @ts-expect-error - Mocking EventSource for testing
    globalThis.EventSource = class MockEventSource {
      constructor(public url: string) {}

      addEventListener() {}

      close() {}
    }

    try {
      await runCommand(RunDetached, [
        '--app',
        'myapp',
        '--tail',
        'echo',
        'test',
      ])
    } finally {
      globalThis.EventSource = originalEventSource
    }

    expect(fakePlatform.dyno.run.calledOnce).to.equal(true)
    const options = fakePlatform.dyno.run.firstCall.args[2]
    expect(options.attach).to.equal(false)
  })
})
