import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
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
