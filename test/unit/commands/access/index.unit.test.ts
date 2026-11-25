import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/access/index.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  appCollaborator: {list: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    appCollaborator: {list: sinon.stub()},
  }
}

describe('heroku access', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  context('with no permissions on any collaborator', function () {
    it('shows the app collaborators without a permissions column', async function () {
      fakePlatform.appCollaborator.list.resolves([
        {role: 'owner', user: {email: 'gandalf@heroku.com'}},
        {role: 'collaborator', user: {email: 'frodo@heroku.com'}},
      ])

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])

      expect(removeAllWhitespace(stdout)).to.contain(removeAllWhitespace('frodo@heroku.com  collaborator \n gandalf@heroku.com owner'))
      expect(stdout.toLowerCase()).to.not.contain('permissions')
      expect(stderr).to.eq('')
      expect(fakePlatform.appCollaborator.list.calledOnceWithExactly('myapp')).to.equal(true)
    })
  })

  context('with permissions on at least one collaborator', function () {
    it('shows the permissions column and hides the team collaborator record', async function () {
      fakePlatform.appCollaborator.list.resolves([
        {
          permissions: [],
          role: 'owner',
          user: {email: 'myteam@herokumanager.com'},
        },
        {
          permissions: [{name: 'deploy'}, {name: 'view'}],
          role: 'member',
          user: {email: 'bob@heroku.com'},
        },
        {
          permissions: [{name: 'deploy'}, {name: 'manage'}, {name: 'operate'}, {name: 'view'}],
          role: 'admin',
          user: {email: 'gandalf@heroku.com'},
        },
      ])

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])

      expect(removeAllWhitespace(stdout)).to.contain(removeAllWhitespace('bob@heroku.com member deploy, view'))
      expect(removeAllWhitespace(stdout)).to.contain(removeAllWhitespace('gandalf@heroku.com admin deploy, manage, operate, view'))
      expect(stdout).to.not.contain('herokumanager.com')
      expect(stdout.toLowerCase()).to.contain('permissions')
      expect(stderr).to.eq('')
    })
  })

  context('with --json', function () {
    it('prints the raw collaborators as json', async function () {
      const collaborators = [
        {role: 'owner', user: {email: 'gandalf@heroku.com'}},
      ]
      fakePlatform.appCollaborator.list.resolves(collaborators)

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--json',
      ])

      expect(JSON.parse(stdout)).to.deep.equal(collaborators)
      expect(stderr).to.eq('')
    })
  })
})
