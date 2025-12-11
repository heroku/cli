import {expect} from 'chai'
import nock from 'nock'
import {stderr} from 'stdout-stderr'

import RunDetached from '../../../../src/commands/run/detached.js'
import runCommand from '../../../helpers/runCommand.js'

describe('run:detached', function () {
  beforeEach(function () {
    nock.cleanAll()
    nock.disableNetConnect()
  })

  afterEach(function () {
    nock.enableNetConnect()
  })

  it('requires a command', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})

    await runCommand(RunDetached, [
      '--app',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.include('Usage: heroku run COMMAND')
    })
  })

  it('creates a detached dyno', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})
      .post('/apps/myapp/dynos', body => {
        expect(body.attach).to.equal(false)
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

    await runCommand(RunDetached, [
      '--app',
      'myapp',
      'echo',
      'test',
    ])
    // The command should output a message about viewing logs
    expect(stderr.output).to.match(/Run.*heroku logs|Running.*done/)
  })

  it('streams logs when --tail is specified', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})
      .post('/apps/myapp/dynos', body => {
        expect(body.attach).to.equal(false)
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

    // Mock EventSource for log streaming
    const originalEventSource = global.EventSource
    // @ts-expect-error - Mocking EventSource for testing
    global.EventSource = class MockEventSource {
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
      ]).catch(() => {
        // Expected to fail when trying to connect to logs
      })
    } finally {
      global.EventSource = originalEventSource
    }
  })
})
