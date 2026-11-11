import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/access/add.js'
import {
  personalApp, teamApp, teamAppWithoutOwner,
} from '../../../helpers/stubs/get.js'
import {collaborators, teamAppCollaborators} from '../../../helpers/stubs/post.js'

let apiGet: nock.Scope
let apiPost: nock.Scope

describe('heroku access:add', function () {
  context('with a team app', function () {
    beforeEach(function () {
      apiGet = teamApp()
      apiPost = teamAppCollaborators('gandalf@heroku.com', ['deploy', 'view'])
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('sorts and deduplicates permissions, including the implicit view permission', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'view,deploy,deploy',
        'gandalf@heroku.com',
      ])
      apiGet.done()
      apiPost.done()
      expect('').to.eq(stdout)
      expect(stderr).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp with deploy, view permissions... done\n')
    })

    it('adds user to the app with permissions, and view is implicit', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy',
        'gandalf@heroku.com',
      ])
      apiGet.done()
      apiPost.done()
      expect('').to.eq(stdout)
      expect(stderr).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp with deploy, view permissions... done\n')
    })

    it('adds user to the app without permissions when they are not specified', async function () {
      apiPost = teamAppCollaborators()
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      apiGet.done()
      apiPost.done()
      expect('').to.eq(stdout)
      expect(stderr).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp... done\n')
    })
  })

  context('with a team app whose owner is missing from the response', function () {
    beforeEach(function () {
      apiGet = teamAppWithoutOwner()
      apiPost = teamAppCollaborators('gandalf@heroku.com', ['deploy', 'view'])
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('adds user to the app with permissions', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy',
        'gandalf@heroku.com',
      ])
      apiGet.done()
      apiPost.done()
      expect('').to.eq(stdout)
      expect(stderr).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp with deploy, view permissions... done\n')
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
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      apiGet.done()
      apiPost.done()
      expect('').to.eq(stdout)
      expect(stderr).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp... done\n')
    })

    it('adds user to the app as a collaborator when permissions are specified', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy',
        'gandalf@heroku.com',
      ])
      apiGet.done()
      apiPost.done()
      expect('').to.eq(stdout)
      expect(stderr).to.equal('Adding gandalf@heroku.com access to the app ⬢ myapp... done\n')
    })
  })
})
