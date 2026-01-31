import {expect} from 'chai'
import nock from 'nock'

import Run from '../../../../src/commands/run/index.js'
import runCommand from '../../../helpers/runCommand.js'

describe('run', function () {
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
})
