import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'
import {createSandbox} from 'sinon'

import Destroy from '../../../../src/commands/apps/destroy.js'
import {gitService} from '../../../../src/lib/ci/git.js'

type FakePlatform = {
  app: {delete: sinon.SinonStub; info: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {delete: sinon.stub(), info: sinon.stub()},
  }
}

describe('apps:destroy', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('deletes the app', async function () {
    fakePlatform.app.info.resolves({name: 'myapp'})
    fakePlatform.app.delete.resolves({name: 'myapp'})

    const {stderr, stdout} = await runCommand(Destroy, ['--app', 'myapp', '--confirm', 'myapp'])

    expect(stdout).to.equal('')
    expect(stderr).to.include('Destroying ⬢ myapp (including all add-ons)... done')
    expect(fakePlatform.app.info.calledOnceWithExactly('myapp')).to.equal(true)
    expect(fakePlatform.app.delete.calledOnceWithExactly('myapp')).to.equal(true)
    expect(fakePlatform.app.info.calledBefore(fakePlatform.app.delete)).to.equal(true)
  })

  it('deletes the app via arg', async function () {
    fakePlatform.app.info.resolves({name: 'myapp'})
    fakePlatform.app.delete.resolves({name: 'myapp'})

    const {stderr, stdout} = await runCommand(Destroy, ['myapp', '--confirm', 'myapp'])

    expect(stdout).to.equal('')
    expect(stderr).to.include('Destroying ⬢ myapp (including all add-ons)... done')
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
    sinon.stub(gitService, 'listRemotes').resolves(new Map())
    sinon.stub(APIClient.prototype, 'auth').get(() => 'cli-keychain-token')

    let authHeader: string | undefined
    const destroyAPI = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(function () {
        authHeader = this.req.headers.authorization as unknown as string
        return [200, {name: 'myapp'}]
      })
      .delete('/apps/myapp')
      .reply(200, {name: 'myapp'})

    await runCommand(Destroy, ['--app', 'myapp', '--confirm', 'myapp'])

    expect(authHeader).to.equal('Bearer cli-keychain-token')
    destroyAPI.done()
  })

  it('threads the CLI-resolved API host into the SDK client options', async function () {
    // Opt out of the shared platform getter stub so the real SDK + platform
    // client run and issue real HTTP requests. The command must forward
    // `vars.apiUrl` as `clientOptions.baseUrl`; `vars.apiUrl` honors HEROKU_HOST
    // exactly as the rest of the CLI does. Point HEROKU_HOST at an allow-listed
    // staging host (so `vars` does NOT fall back to production) and intercept
    // the staging API instead of api.heroku.com. If the command dropped
    // `clientOptions.baseUrl`, the SDK would hit api.heroku.com, this staging
    // scope would never match, and nock.disableNetConnect() would throw.
    const originalHerokuHost = process.env.HEROKU_HOST
    process.env.HEROKU_HOST = 'staging.herokudev.com'
    sinon.restore()
    sinon.stub(gitService, 'listRemotes').resolves(new Map())
    sinon.stub(APIClient.prototype, 'auth').get(() => 'cli-keychain-token')

    const stagingAPI = nock('https://api.staging.herokudev.com:443')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})
      .delete('/apps/myapp')
      .reply(200, {name: 'myapp'})

    try {
      await runCommand(Destroy, ['--app', 'myapp', '--confirm', 'myapp'])

      stagingAPI.done()
    } finally {
      if (originalHerokuHost === undefined) {
        delete process.env.HEROKU_HOST
      } else {
        process.env.HEROKU_HOST = originalHerokuHost
      }
    }
  })

  it('errors without an app', async function () {
    const {error} = await runCommand(Destroy, [])

    expect(error?.message).to.include('No app specified.')
  })

  describe('git remote cleanup', function () {
    const sandbox = createSandbox()

    afterEach(function () {
      sandbox.restore()
    })

    it('removes duplicate git remotes without error (issue #3677)', async function () {
      fakePlatform.app.info.resolves({name: 'myapp'})
      fakePlatform.app.delete.resolves({name: 'myapp'})

      const rmRemoteCalls: string[] = []

      // Stub gitService methods
      sandbox.stub(gitService, 'inGitRepo').returns(true)
      // Return a map with duplicate entries (fetch + push for same remote)
      const mockRemotes = new Map([
        ['https://git.heroku.com/myapp.git', [
          {kind: '(fetch)', name: 'heroku'},
          {kind: '(push)', name: 'heroku'},
        ]],
      ])
      sandbox.stub(gitService, 'listRemotes').resolves(mockRemotes)
      sandbox.stub(gitService, 'gitUrl').returns('https://git.heroku.com/myapp.git')
      sandbox.stub(gitService, 'sshGitUrl').returns('git@git.heroku.com:myapp.git')
      sandbox.stub(gitService, 'rmRemote').callsFake(async (name: string) => {
        rmRemoteCalls.push(name)
      })

      await runCommand(Destroy, ['--app', 'myapp', '--confirm', 'myapp'])

      // Verify rmRemote was called exactly once (deduplication worked)
      expect(rmRemoteCalls.length).to.equal(1)
      expect(rmRemoteCalls[0]).to.equal('heroku')
    })

    it('removes multiple different remotes', async function () {
      fakePlatform.app.info.resolves({name: 'myapp'})
      fakePlatform.app.delete.resolves({name: 'myapp'})

      const rmRemoteCalls: string[] = []

      sandbox.stub(gitService, 'inGitRepo').returns(true)
      // Multiple remotes with duplicates (fetch + push for each)
      const mockRemotes = new Map([
        ['https://git.heroku.com/myapp.git', [
          {kind: '(fetch)', name: 'heroku'},
          {kind: '(push)', name: 'heroku'},
          {kind: '(fetch)', name: 'production'},
          {kind: '(push)', name: 'production'},
        ]],
      ])
      sandbox.stub(gitService, 'listRemotes').resolves(mockRemotes)
      sandbox.stub(gitService, 'gitUrl').returns('https://git.heroku.com/myapp.git')
      sandbox.stub(gitService, 'sshGitUrl').returns('git@git.heroku.com:myapp.git')
      sandbox.stub(gitService, 'rmRemote').callsFake(async (name: string) => {
        rmRemoteCalls.push(name)
      })

      await runCommand(Destroy, ['--app', 'myapp', '--confirm', 'myapp'])

      // Verify both remotes were removed exactly once each
      expect(rmRemoteCalls.length).to.equal(2)
      expect(rmRemoteCalls).to.have.members(['heroku', 'production'])
    })
  })
})
