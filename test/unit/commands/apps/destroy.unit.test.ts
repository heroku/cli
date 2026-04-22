import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {createSandbox} from 'sinon'

import Destroy from '../../../../src/commands/apps/destroy.js'
import {gitService} from '../../../../src/lib/ci/git.js'

describe('apps:destroy', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('deletes the app', async function () {
    api
      .get('/apps/myapp').reply(200, {name: 'myapp'})
      .delete('/apps/myapp').reply(200)

    const {stderr, stdout} = await runCommand(Destroy, ['--app', 'myapp', '--confirm', 'myapp'])

    expect(stdout).to.equal('')
    expect(stderr).to.include('Destroying ⬢ myapp (including all add-ons)... done')
  })

  it('deletes the app via arg', async function () {
    api
      .get('/apps/myapp').reply(200, {name: 'myapp'})
      .delete('/apps/myapp').reply(200)

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
      api
        .get('/apps/myapp').reply(200, {name: 'myapp'})
        .delete('/apps/myapp').reply(200)

      const rmRemoteCalls: string[] = []

      // Stub gitService methods
      sandbox.stub(gitService, 'inGitRepo').returns(true)
      // Return a map with duplicate entries (fetch + push for same remote)
      const mockRemotes = new Map([
        ['https://git.heroku.com/myapp.git', [
          {name: 'heroku', kind: '(fetch)'},
          {name: 'heroku', kind: '(push)'},
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
      api
        .get('/apps/myapp').reply(200, {name: 'myapp'})
        .delete('/apps/myapp').reply(200)

      const rmRemoteCalls: string[] = []

      sandbox.stub(gitService, 'inGitRepo').returns(true)
      // Multiple remotes with duplicates (fetch + push for each)
      const mockRemotes = new Map([
        ['https://git.heroku.com/myapp.git', [
          {name: 'heroku', kind: '(fetch)'},
          {name: 'heroku', kind: '(push)'},
          {name: 'production', kind: '(fetch)'},
          {name: 'production', kind: '(push)'},
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
