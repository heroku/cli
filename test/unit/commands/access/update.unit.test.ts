import type {App} from '@heroku/types/3.sdk'

import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {NotATeamAppError} from '@heroku/sdk/extensions/platform'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/access/update.js'

type FakePlatform = {
  appCollaborator: {update: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    appCollaborator: {update: sinon.stub()},
  }
}

describe('heroku access:update', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  context('with a team app', function () {
    beforeEach(function () {
      fakePlatform.appCollaborator.update.resolves({permissions: ['deploy', 'view'], user: {email: 'gandalf@heroku.com'}})
    })

    it('updates the app permissions, view being implicit', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy',
        'gandalf@heroku.com',
      ])
      expect(stdout).to.eq('')
      expect(stderr).to.equal('Updating gandalf@heroku.com in application ⬢ myapp with deploy,view permissions... done\n')
      expect(fakePlatform.appCollaborator.update.calledOnceWithExactly('myapp', 'gandalf@heroku.com', {permissions: ['deploy', 'view']})).to.equal(true)
    })

    it('updates the app permissions, even specifying view as a permission', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy,view',
        'gandalf@heroku.com',
      ])
      expect(stdout).to.eq('')
      expect(stderr).to.equal('Updating gandalf@heroku.com in application ⬢ myapp with deploy,view permissions... done\n')
      expect(fakePlatform.appCollaborator.update.calledOnceWithExactly('myapp', 'gandalf@heroku.com', {permissions: ['deploy', 'view']})).to.equal(true)
    })
  })

  context('with a non-team app', function () {
    beforeEach(function () {
      fakePlatform.appCollaborator.update.rejects(new NotATeamAppError({name: 'myapp', team: null} as App))
    })

    it('returns an error when passing permissions', async function () {
      const {error} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'view,deploy',
        'gandalf@heroku.com',
      ])
      expect(ansis.strip(error?.message ?? '')).to.contain('Cannot update permissions. The app ⬢ myapp is not owned by a team')
    })
  })
})
