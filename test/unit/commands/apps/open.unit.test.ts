import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import childProcess from 'node:child_process'
import * as sinon from 'sinon'

import OpenCommand from '../../../../src/commands/apps/open.js'

type FakePlatform = {
  app: {info: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {info: sinon.stub()},
  }
}

describe('apps:open', function () {
  const app = {
    name: 'myapp',
    web_url: 'https://myapp.herokuapp.com/',
  }

  let fakePlatform: FakePlatform
  let spawnStub: sinon.SinonStub

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    spawnStub = sinon.stub(childProcess, 'spawn').returns({
      on(event: string, cb: CallableFunction) {
        if (event === 'exit') {
          cb()
        }
      }, unref() {},
    } as any)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('opens the url', async function () {
    fakePlatform.app.info.resolves(app)

    await runCommand(OpenCommand, ['-a', 'myapp'])

    const urlArgArray = spawnStub.getCall(0).args[1]
    // For darwin-based platforms this arg is an array that contains the site url.
    // For windows-based platforms this arg is an array that contains an encoded command that includes the url
    const hasCorrectUrl = urlArgArray.includes('https://myapp.herokuapp.com/') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AbQB5AGEAcABwAC4AaABlAHIAbwBrAHUAYQBwAHAALgBjAG8AbQAvACIA')
    expect(hasCorrectUrl).to.be.true
    expect(fakePlatform.app.info.calledOnceWithExactly('myapp')).to.equal(true)
  })

  it('threads the CLI auth token into the SDK client options', async function () {
    // Opt out of the shared platform getter stub so the real SDK + platform
    // client run and issue a real HTTP request. The command must forward the
    // CLI-resolved `this.heroku.auth` as `clientOptions.token`, which
    // heroku-fetch turns into the outgoing `Authorization: Bearer <token>`
    // header. Pin `this.heroku.auth` to a sentinel distinct from the test env's
    // HEROKU_API_KEY so this fails if the command drops
    // `clientOptions: {token: this.heroku.auth}` (the SDK would fall back to the
    // env token, flipping the header).
    sinon.restore()
    sinon.stub(childProcess, 'spawn').returns({
      on(event: string, cb: CallableFunction) {
        if (event === 'exit') {
          cb()
        }
      }, unref() {},
    } as any)
    sinon.stub(APIClient.prototype, 'auth').get(() => 'cli-keychain-token')

    let authHeader: string | undefined
    const infoAPI = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(function () {
        authHeader = this.req.headers.authorization as unknown as string
        return [200, app]
      })

    await runCommand(OpenCommand, ['-a', 'myapp'])

    expect(authHeader).to.equal('Bearer cli-keychain-token')
    infoAPI.done()
  })

  it('threads the CLI-resolved API host into the SDK client options', async function () {
    // Opt out of the shared platform getter stub so the real SDK + platform
    // client run and issue a real HTTP request. The command must forward
    // `vars.apiUrl` as `clientOptions.baseUrl`; `vars.apiUrl` honors HEROKU_HOST
    // exactly as the rest of the CLI does. Point HEROKU_HOST at an allow-listed
    // staging host (so `vars` does NOT fall back to production) and intercept
    // the staging API instead of api.heroku.com. If the command dropped
    // `clientOptions.baseUrl`, the SDK would hit api.heroku.com, this staging
    // scope would never match, and nock.disableNetConnect() would throw.
    const originalHerokuHost = process.env.HEROKU_HOST
    process.env.HEROKU_HOST = 'staging.herokudev.com'
    sinon.restore()
    sinon.stub(childProcess, 'spawn').returns({
      on(event: string, cb: CallableFunction) {
        if (event === 'exit') {
          cb()
        }
      }, unref() {},
    } as any)
    sinon.stub(APIClient.prototype, 'auth').get(() => 'cli-keychain-token')

    const stagingAPI = nock('https://api.staging.herokudev.com:443')
      .get('/apps/myapp')
      .reply(200, app)

    try {
      await runCommand(OpenCommand, ['-a', 'myapp'])

      stagingAPI.done()
    } finally {
      if (originalHerokuHost === undefined) {
        delete process.env.HEROKU_HOST
      } else {
        process.env.HEROKU_HOST = originalHerokuHost
      }
    }
  })

  it('opens the url with path', async function () {
    fakePlatform.app.info.resolves(app)

    await runCommand(OpenCommand, ['-a', 'myapp', '/mypath'])

    const urlArgArray = spawnStub.getCall(0).args[1]
    // For darwin-based platforms this arg is an array that contains the site url.
    // For windows-based platforms this arg is an array that contains an encoded command that includes the url
    const hasCorrectUrl = urlArgArray.includes('https://myapp.herokuapp.com/mypath') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AbQB5AGEAcABwAC4AaABlAHIAbwBrAHUAYQBwAHAALgBjAG8AbQAvAG0AeQBwAGEAdABoACIA')
    expect(hasCorrectUrl).to.be.true
  })
})
