import {APIClient} from '@heroku-cli/command'
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

  it('threads the CLI auth token into the per-call run:inside client', async function () {
    // run:inside sets options.dyno, so the SDK routes dyno.run through postRun, which builds
    // its OWN per-call client (POST /apps/{app}/dynos/{dyno}), not the SDK-level client. The
    // command must thread the CLI token in via apiClientOptions(this.opts.heroku); drop it and
    // the exec request goes out unauthenticated. Run the real SDK (restore the platform-getter
    // mock) with getAuthEntry stubbed to a sentinel token so this fails if clientOptions stops
    // being threaded.
    sdkMock.restore()
    sdkMock = {restore() {}}
    const getAuthEntryStub = sinon.stub(APIClient.prototype, 'getAuthEntry').resolves({account: undefined, token: 'cli-keychain-token'})

    try {
      nock('https://api.heroku.com')
        .get('/apps/myapp')
        .reply(200, {name: 'myapp', stack: {name: 'heroku-20'}})

      let authHeader: string | undefined
      const runAPI = nock('https://api.heroku.com')
        .post('/apps/myapp/dynos/web.1')
        .reply(function () {
          authHeader = this.req.headers.authorization as unknown as string
          return [200, {
            attach_url: 'rendezvous://rendezvous.runtime.heroku.com:5000',
            command: 'bash',
            created_at: '2020-01-01T00:00:00Z',
            id: '12345678-1234-1234-1234-123456789012',
            name: 'web.1',
            size: 'basic',
            state: 'starting',
            type: 'web',
            updated_at: '2020-01-01T00:00:00Z',
          }]
        })

      const {error} = await runWithCliArgv([
        'web.1',
        'bash',
        '--app',
        'myapp',
      ])
      expect(error).to.exist

      expect(authHeader).to.equal('Bearer cli-keychain-token')
      runAPI.done()
    } finally {
      getAuthEntryStub.restore()
    }
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

    const {error} = await runWithCliArgv([
      'web.1',
      'bash',
      '--app',
      'myapp',
    ])
    expect(error).to.exist

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

    const {error} = await runWithCliArgv([
      'web.1',
      'bash',
      '--app',
      'myapp',
      '--no-launcher',
    ])
    expect(error).to.exist

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

    const {error} = await runWithCliArgv([
      'web.1',
      'bash',
      '--app',
      'myapp',
    ])
    expect(error).to.exist

    expect(fakePlatform.dyno.run.calledOnce).to.equal(true)
    const [appId, command] = fakePlatform.dyno.run.firstCall.args
    expect(appId).to.equal('myapp')
    expect(command).to.include('launcher')
  })
})
