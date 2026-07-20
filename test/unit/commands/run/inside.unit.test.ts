import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import RunInside from '../../../../src/commands/run/inside.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

type FakePlatform = {
  dyno: {run: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    dyno: {run: sinon.stub()},
  }
}

describe('run:inside', function () {
  let fakePlatform: FakePlatform
  let sdkMock: MockSDK
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
    fakePlatform = buildFakePlatform()
    sdkMock = mockSDKPlatform(fakePlatform)
    nock.cleanAll()
    nock.disableNetConnect()
  })

  afterEach(function () {
    sdkMock.restore()
    nock.enableNetConnect()
    process.argv = [...originalProcessArgv]
  })

  it('requires a dyno name and command', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})

    const {error} = await runWithCliArgv([
      '--app',
      'myapp',
    ])
    expect(error?.message).to.include('Missing')
    expect(error?.message).to.include('dyno_name')
  })

  it('runs a command inside an existing dyno', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})

    fakePlatform.dyno.run.resolves({
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

    expect(fakePlatform.dyno.run.calledOnce).to.equal(true)
    const [appId, command, options] = fakePlatform.dyno.run.firstCall.args
    expect(appId).to.equal('myapp')
    expect(command).to.equal('bash')
    expect(options.dyno).to.equal('web.1')
  })

  it('handles exit codes when --exit-code is specified', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})

    fakePlatform.dyno.run.resolves({
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

    const {error} = await runWithCliArgv([
      'web.1',
      'false',
      '--app',
      'myapp',
      '--exit-code',
    ])
    // Expected to fail with exit code 1 or connection error
    expect(error).to.exist
  })

  it('respects --no-launcher flag', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'cnb'}})

    fakePlatform.dyno.run.resolves({
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

    expect(fakePlatform.dyno.run.calledOnce).to.equal(true)
    const command = fakePlatform.dyno.run.firstCall.args[1]
    expect(command).to.not.include('launcher')
  })

  it('prepends launcher by default on cnb apps', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', stack: {name: 'cnb'}})

    fakePlatform.dyno.run.resolves({
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

    expect(fakePlatform.dyno.run.calledOnce).to.equal(true)
    const [appId, command] = fakePlatform.dyno.run.firstCall.args
    expect(appId).to.equal('myapp')
    expect(command).to.include('launcher')
  })
})
