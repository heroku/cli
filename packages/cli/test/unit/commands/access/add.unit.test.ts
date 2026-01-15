import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/access/add.js'
import runCommand from '../../../helpers/runCommand.js'
import {personalApp, teamApp, teamFeatures} from '../../../helpers/stubs/get.js'
import {collaborators, teamAppCollaborators} from '../../../helpers/stubs/post.js'

let apiGet: nock.Scope
let apiPost: nock.Scope
let apiGetOrgFeatures: nock.Scope

describe('heroku access:add', function () {
  context('with a team app with user permissions', function () {
    beforeEach(function () {
      apiGet = teamApp()
      apiPost = teamAppCollaborators('gandalf@heroku.com', ['deploy', 'view'])
      apiGetOrgFeatures = teamFeatures([{name: 'org-access-controls'}])
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('adds user to the app with permissions, even specifying the view permission', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy,view',
        'gandalf@heroku.com',
      ])
      apiGet.done()
      apiGetOrgFeatures.done()
      apiPost.done()
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp with deploy, view permissions... done\n')
    })

    it('adds user to the app with permissions, and view is implicit', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy',
        'gandalf@heroku.com',
      ])
      apiGet.done()
      apiGetOrgFeatures.done()
      apiPost.done()
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp with deploy, view permissions... done\n')
    })

    it('raises an error when permissions are not specified', function () {
      return runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
        .then(() => {
          apiGet.done()
          apiGetOrgFeatures.done()
          apiPost.done()
        })
        .catch((error: any) => expect(error.message).to.equal('Missing argument: permissions'))
    })
  })

  context('with a team app without user permissions', function () {
    beforeEach(function () {
      apiGet = teamApp()
      apiPost = collaborators()
      apiGetOrgFeatures = teamFeatures([])
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('adds user to the app', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      apiGet.done()
      apiGetOrgFeatures.done()
      apiPost.done()
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp... done\n')
    })
  })

  context('with a non team app', function () {
    beforeEach(function () {
      apiGet = personalApp()
      apiPost = collaborators()
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('adds user to the app as a collaborator', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      apiGet.done()
      apiPost.done()
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp... done\n')
    })
  })
})
