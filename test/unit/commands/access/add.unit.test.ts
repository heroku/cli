import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/access/add.js'

type FakePlatform = {
  app: {info: sinon.SinonStub}
  appCollaborator: {add: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {info: sinon.stub()},
    appCollaborator: {add: sinon.stub()},
  }
}

describe('heroku access:add', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    fakePlatform.appCollaborator.add.resolves({user: {email: 'gandalf@heroku.com'}})
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  context('with a team app', function () {
    beforeEach(function () {
      fakePlatform.app.info.resolves({name: 'myapp', team: {name: 'myteam'}})
    })

    it('adds user to the app with permissions, even specifying the view permission', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy,view',
        'gandalf@heroku.com',
      ])
      expect(stdout).to.eq('')
      expect(stderr).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp with deploy, view permissions... done\n')
      expect(fakePlatform.appCollaborator.add.calledOnceWithExactly('myapp', 'gandalf@heroku.com', {permissions: ['deploy', 'view']})).to.equal(true)
    })

    it('adds user to the app with permissions, and view is implicit', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy',
        'gandalf@heroku.com',
      ])
      expect(stdout).to.eq('')
      expect(stderr).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp with deploy, view permissions... done\n')
      expect(fakePlatform.appCollaborator.add.calledOnceWithExactly('myapp', 'gandalf@heroku.com', {permissions: ['deploy']})).to.equal(true)
    })

    it('adds user to the app without permissions', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      expect(stdout).to.eq('')
      expect(stderr).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp... done\n')
      expect(fakePlatform.appCollaborator.add.calledOnceWithExactly('myapp', 'gandalf@heroku.com', {permissions: undefined})).to.equal(true)
    })
  })

  context('with a non-team app', function () {
    beforeEach(function () {
      fakePlatform.app.info.resolves({name: 'myapp', team: null})
    })

    it('adds user to the app as a collaborator', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      expect(stdout).to.eq('')
      expect(stderr).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp... done\n')
      expect(fakePlatform.appCollaborator.add.calledOnceWithExactly('myapp', 'gandalf@heroku.com', {permissions: undefined})).to.equal(true)
    })

    it('does not mention permissions even when permissions are passed', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy',
        'gandalf@heroku.com',
      ])
      expect(stdout).to.eq('')
      expect(stderr).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp... done\n')
      expect(fakePlatform.appCollaborator.add.calledOnceWithExactly('myapp', 'gandalf@heroku.com', {permissions: ['deploy']})).to.equal(true)
    })
  })
})
