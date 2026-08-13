import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'

import AppsDiff from '../../../../src/commands/apps/diff.js'

type FakePlatform = {
  app: {diff: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {diff: sinon.stub()},
  }
}

describe('apps:diff', function () {
  const app1Name = 'myapp-one'
  const app2Name = 'myapp-two'
  const sameChecksum = 'SHA256:same-checksum-for-both-apps'

  let fakePlatform: FakePlatform
  let platformGetterStub: SinonStub

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    platformGetterStub = sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform) as unknown as SinonStub
  })

  afterEach(function () {
    sinon.restore()
  })

  it('threads the CLI auth token into the SDK client options', async function () {
    // Opt out of the shared platform getter stub so the real SDK + platform
    // client run and issue real HTTP requests. The command must forward the
    // CLI-resolved `this.heroku.auth` as `clientOptions.token`, which
    // heroku-fetch turns into the outgoing `Authorization: Bearer <token>`
    // header. Pin `this.heroku.auth` to a sentinel distinct from the test env's
    // HEROKU_API_KEY so this fails if the command drops
    // `clientOptions: {token: this.heroku.auth}` (the SDK would fall back to the
    // env token, flipping the header).
    platformGetterStub.restore()
    sinon.stub(APIClient.prototype, 'auth').get(() => 'cli-keychain-token')

    let authHeader: string | undefined
    // diff fans out GET requests across both apps; intercept every endpoint it
    // touches with empty payloads. `persist()` covers the two apps sharing a
    // path shape. The first release lookup records the auth header.
    const diffAPI = nock('https://api.heroku.com:443')
      .persist()
      .get('/apps/myapp-one/releases')
      .reply(function () {
        authHeader = this.req.headers.authorization as unknown as string
        return [200, []]
      })
      .get('/apps/myapp-two/releases').reply(200, [])
      .get('/apps/myapp-one/config-vars').reply(200, {})
      .get('/apps/myapp-two/config-vars').reply(200, {})
      .get('/apps/myapp-one').reply(200, {name: 'myapp-one', stack: {name: 'heroku-24'}})
      .get('/apps/myapp-two').reply(200, {name: 'myapp-two', stack: {name: 'heroku-24'}})
      .get('/apps/myapp-one/buildpack-installations').reply(200, [])
      .get('/apps/myapp-two/buildpack-installations').reply(200, [])
      .get('/apps/myapp-one/addons').reply(200, [])
      .get('/apps/myapp-two/addons').reply(200, [])
      .get('/apps/myapp-one/features').reply(200, [])
      .get('/apps/myapp-two/features').reply(200, [])

    await runCommand(AppsDiff, [app1Name, app2Name])

    expect(authHeader).to.equal('Bearer cli-keychain-token')
    diffAPI.done()
  })

  it('threads the CLI-resolved API host into the SDK client options', async function () {
    // Opt out of the shared platform getter stub so the real SDK + platform
    // client run and issue real HTTP requests. The command must forward
    // `vars.apiUrl` as `clientOptions.baseUrl`; `vars.apiUrl` honors HEROKU_HOST
    // exactly as the rest of the CLI does. Point HEROKU_HOST at an allow-listed
    // staging host (so `vars` does NOT fall back to production) and intercept
    // the staging API instead of api.heroku.com. If the command dropped
    // `clientOptions.baseUrl`, the SDK would hit api.heroku.com, these staging
    // scopes would never match, and nock.disableNetConnect() would throw.
    const originalHerokuHost = process.env.HEROKU_HOST
    process.env.HEROKU_HOST = 'staging.herokudev.com'
    platformGetterStub.restore()
    sinon.stub(APIClient.prototype, 'auth').get(() => 'cli-keychain-token')

    const stagingAPI = nock('https://api.staging.herokudev.com:443')
      .persist()
      .get('/apps/myapp-one/releases').reply(200, [])
      .get('/apps/myapp-two/releases').reply(200, [])
      .get('/apps/myapp-one/config-vars').reply(200, {})
      .get('/apps/myapp-two/config-vars').reply(200, {})
      .get('/apps/myapp-one').reply(200, {name: 'myapp-one', stack: {name: 'heroku-24'}})
      .get('/apps/myapp-two').reply(200, {name: 'myapp-two', stack: {name: 'heroku-24'}})
      .get('/apps/myapp-one/buildpack-installations').reply(200, [])
      .get('/apps/myapp-two/buildpack-installations').reply(200, [])
      .get('/apps/myapp-one/addons').reply(200, [])
      .get('/apps/myapp-two/addons').reply(200, [])
      .get('/apps/myapp-one/features').reply(200, [])
      .get('/apps/myapp-two/features').reply(200, [])

    try {
      await runCommand(AppsDiff, [app1Name, app2Name])

      stagingAPI.done()
    } finally {
      if (originalHerokuHost === undefined) {
        delete process.env.HEROKU_HOST
      } else {
        process.env.HEROKU_HOST = originalHerokuHost
      }
    }
  })

  it('prints table with no diff rows when both apps are identical', async function () {
    fakePlatform.app.diff.resolves([])

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('property')
    expect(stdout).to.include(app1Name)
    expect(stdout).to.include(app2Name)
    expect(stdout.trim()).to.not.include('slug (checksum)')
    expect(fakePlatform.app.diff.calledOnceWith(app1Name, app2Name)).to.equal(true)
  })

  it('includes slug (checksum) row when checksums differ', async function () {
    fakePlatform.app.diff.resolves([
      {app1: 'SHA256:aaaaaaaa', app2: 'SHA256:bbbbbbbb', prop: 'slug (checksum)'},
    ])

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('slug (checksum)')
    expect(stdout).to.include('SHA256:aaaaaaaa')
    expect(stdout).to.include('SHA256:bbbbbbbb')
    expect(fakePlatform.app.diff.calledWith(app1Name, app2Name)).to.equal(true)
  })

  it('includes config and stack diff rows when they differ', async function () {
    fakePlatform.app.diff.resolves([
      {app1: 'a', app2: 'b', prop: 'config (FOO)'},
      {app1: 'heroku-22', app2: 'heroku-24', prop: 'stack'},
    ])

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('config (FOO)')
    expect(stdout).to.include('stack')
    expect(stdout).to.include('heroku-22')
    expect(stdout).to.include('heroku-24')
    expect(fakePlatform.app.diff.calledWith(app1Name, app2Name)).to.equal(true)
  })

  it('propagates App not found when the SDK diff rejects', async function () {
    // The composite platform.app.diff owns the internal fan-out (releases,
    // slug, config, etc.) and its own 404 handling; the CLI can no longer
    // distinguish which endpoint 404'd. Assert only that the command surfaces
    // the SDK's error unchanged.
    fakePlatform.app.diff.rejects(new Error(`App not found: ${app1Name}`))

    const {error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.not.be.undefined
    expect(error!.message).to.include('App not found')
    expect(error!.message).to.include(app1Name)
  })

  it('truncates long values to 56 chars with ellipsis', async function () {
    // trunc() lives in the CLI now, so this is the key CLI-owned presentation
    // test. The SDK returns the full checksum; the command must clamp it.
    const longChecksum = 'SHA256:' + 'a'.repeat(60)

    fakePlatform.app.diff.resolves([
      {app1: longChecksum, app2: sameChecksum, prop: 'slug (checksum)'},
    ])

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('slug (checksum)')
    expect(stdout).to.match(/\.\.\./)
    expect(stdout).to.include('SHA256:')
  })

  it('shows add-on only on second app', async function () {
    fakePlatform.app.diff.resolves([
      {app1: 'false', app2: 'true', prop: 'add-on (heroku-postgresql)'},
    ])

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('add-on (heroku-postgresql)')
    expect(stdout).to.include('false')
    expect(stdout).to.include('true')
  })
})
