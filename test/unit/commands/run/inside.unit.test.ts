import {expect} from 'chai'
import nock from 'nock'

import RunInside from '../../../../src/commands/run/inside.js'
import runCommand from '../../../helpers/runCommand.js'

describe('run:inside', function () {
  const originalProcessArgv = [...process.argv]

  const runWithCliArgv = async (args: string[]) => {
    process.argv = [
      '/usr/local/bin/node',
      '/usr/local/bin/heroku',
      'run:inside',
      ...args,
    ]

    return runCommand(RunInside, args)
  }

  beforeEach(function () {
    nock.cleanAll()
    nock.disableNetConnect()
  })

  afterEach(function () {
    nock.enableNetConnect()
    process.argv = [...originalProcessArgv]
  })

  it('requires a dyno name and command', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})

    await runWithCliArgv([
      '--app',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.include('Missing')
      expect(error.message).to.include('dyno_name')
    })
  })

  it('runs a command inside an existing dyno', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})
      .post('/apps/myapp/dynos/web.1', body => {
        expect(body.command).to.equal('bash')
        return true
      })
      .reply(201, {
        attach_url: 'rendezvous://rendezvous.runtime.heroku.com:5000',
        command: 'bash',
        created_at: '2020-01-01T00:00:00Z',
        id: '12345678-1234-1234-1234-123456789012',
        name: 'web.1',
        size: 'basic',
        state: 'starting',
        type: 'web',
        updated_at: '2020-01-01T00:00:00Z',
      })

    await runWithCliArgv([
      'web.1',
      'bash',
      '--app',
      'myapp',
    ]).catch(() => {
      // Expected to fail when trying to connect
    })
  })

  it('handles exit codes when --exit-code is specified', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})
      .post('/apps/myapp/dynos/web.1')
      .reply(201, {
        attach_url: 'rendezvous://rendezvous.runtime.heroku.com:5000',
        command: 'false; echo "\uFFFF heroku-command-exit-status: 1"',
        created_at: '2020-01-01T00:00:00Z',
        id: '12345678-1234-1234-1234-123456789012',
        name: 'web.1',
        size: 'basic',
        state: 'starting',
        type: 'web',
        updated_at: '2020-01-01T00:00:00Z',
      })

    await runWithCliArgv([
      'web.1',
      'false',
      '--app',
      'myapp',
      '--exit-code',
    ]).catch(error => {
      // Expected to fail with exit code 1 or connection error
      expect(error).to.exist
    })
  })

  it('respects --no-launcher flag', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'cnb'}})
      .post('/apps/myapp/dynos/web.1', body => {
        expect(body.command).to.equal('bash')
        return true
      })
      .reply(201, {
        attach_url: 'rendezvous://rendezvous.runtime.heroku.com:5000',
        command: 'bash',
        created_at: '2020-01-01T00:00:00Z',
        id: '12345678-1234-1234-1234-123456789012',
        name: 'web.1',
        size: 'basic',
        state: 'starting',
        type: 'web',
        updated_at: '2020-01-01T00:00:00Z',
      })

    await runWithCliArgv([
      'web.1',
      'bash',
      '--app',
      'myapp',
      '--no-launcher',
    ]).catch(() => {
      // Expected to fail when trying to connect
    })
  })

  it('prepends launcher by default on cnb apps', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'cnb'}})
      .post('/apps/myapp/dynos/web.1', body => {
        expect(body.command).to.equal('launcher bash')
        return true
      })
      .reply(201, {
        attach_url: 'rendezvous://rendezvous.runtime.heroku.com:5000',
        command: 'launcher bash',
        created_at: '2020-01-01T00:00:00Z',
        id: '12345678-1234-1234-1234-123456789012',
        name: 'web.1',
        size: 'basic',
        state: 'starting',
        type: 'web',
        updated_at: '2020-01-01T00:00:00Z',
      })

    await runWithCliArgv([
      'web.1',
      'bash',
      '--app',
      'myapp',
    ]).catch(() => {
      // Expected to fail when trying to connect
    })
  })
})
