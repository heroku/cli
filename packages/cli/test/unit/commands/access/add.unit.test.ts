import {stdout, stderr} from 'stdout-stderr'
import * as nock from 'nock'
import {expect} from 'chai'
import Cmd  from '../../../../src/commands/access/add'
import runCommand from '../../../helpers/runCommand'
import {personalApp, teamApp, teamFeatures} from '../../../helpers/stubs/get'
import {collaborators, teamAppCollaborators} from '../../../helpers/stubs/post'

let apiGet: nock.Scope
let apiPost: nock.Scope
let apiGetOrgFeatures: nock.Scope
describe('heroku access:add', () => {
  context('with a team app with user permissions', () => {
    beforeEach(() => {
      apiGet = teamApp()
      apiPost = teamAppCollaborators('raulb@heroku.com', ['deploy', 'view'])
      apiGetOrgFeatures = teamFeatures([{name: 'org-access-controls'}])
    })
    afterEach(() => nock.cleanAll())
    it('adds user to the app with permissions, and view is implicit', () => {
      return runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy',
        'raulb@heroku.com',
      ])
        .then(() => expect('').to.eq(stdout.output))
        .then(() => expect('Adding raulb@heroku.com access to the app myapp with deploy, view permissions...\nAdding raulb@heroku.com access to the app myapp with deploy, view permissions... done\n').to.eq(stderr.output))
        .then(() => apiGet.done())
        .then(() => apiGetOrgFeatures.done())
        .then(() => apiPost.done())
    })
    it('adds user to the app with permissions, even specifying the view permission', () => {
      return runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy,view',
        'raulb@heroku.com',
      ])
        .then(() => expect('').to.eq(stdout.output))
        .then(() => expect('Adding raulb@heroku.com access to the app myapp with deploy, view permissions...\nAdding raulb@heroku.com access to the app myapp with deploy, view permissions... done\n').to.eq(stderr.output))
        .then(() => apiGet.done())
        .then(() => apiGetOrgFeatures.done())
        .then(() => apiPost.done())
    })
    it('raises an error when permissions are not specified', () => {
      return runCommand(Cmd, [
        '--app',
        'myapp',
        'raulb@heroku.com',
      ])
        .then(() => {
          apiGet.done()
          apiGetOrgFeatures.done()
          apiPost.done()
        })
        .catch((error: any) => expect(error.message).to.equal('Missing argument: permissions'))
    })
  })
  context('with a team app without user permissions', () => {
    beforeEach(() => {
      apiGet = teamApp()
      apiPost = collaborators()
      apiGetOrgFeatures = teamFeatures([])
    })
    afterEach(() => nock.cleanAll())
    it('adds user to the app', () => {
      return runCommand(Cmd, [
        '--app',
        'myapp',
        'raulb@heroku.com',
      ])
        .then(() => expect('').to.eq(stdout.output))
        .then(() => expect('Adding raulb@heroku.com access to the app myapp...\nAdding raulb@heroku.com access to the app myapp... done\n').to.eq(stderr.output))
        .then(() => apiGet.done())
        .then(() => apiGetOrgFeatures.done())
        .then(() => apiPost.done())
    })
  })
  context('with a non team app', () => {
    beforeEach(() => {
      apiGet = personalApp()
      apiPost = collaborators()
    })
    afterEach(() => nock.cleanAll())
    it('adds user to the app as a collaborator', () => {
      return runCommand(Cmd, [
        '--app',
        'myapp',
        'raulb@heroku.com',
      ])
        .then(() => expect('').to.eq(stdout.output))
        .then(() => expect('Adding raulb@heroku.com access to the app myapp...\nAdding raulb@heroku.com access to the app myapp... done\n').to.eq(stderr.output))
        .then(() => apiGet.done())
        .then(() => apiPost.done())
    })
  })
})
