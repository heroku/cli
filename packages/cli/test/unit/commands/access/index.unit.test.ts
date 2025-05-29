import {stdout, stderr} from 'stdout-stderr'
import nock from 'nock'
import {expect} from 'chai'
// import Cmd from '../../../../src/commands/access/index'
import runCommand from '../../../helpers/runCommand.js'
import {
  personalApp,
  appCollaborators,
  teamApp,
  teamMembers,
  appPermissions,
  teamAppCollaboratorsWithPermissions,
} from '../../../helpers/stubs/get.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

/*
describe('heroku access', function () {
  context('with personal app', function () {
    afterEach(function () {
      return nock.cleanAll()
    })
    it('shows the app collaborators', function () {
      const apiGetPersonalApp = personalApp()
      const apiGetAppCollaborators = appCollaborators()
      return runCommand(Cmd, [
        '--app',
        'myapp',
      ])
        .then(() => expect(removeAllWhitespace(stdout.output)).to.contain(removeAllWhitespace('frodo@heroku.com  collaborator \n gandalf@heroku.com owner')))
        .then(() => expect('').to.eq(stderr.output))
        .then(() => apiGetPersonalApp.done())
        .then(() => apiGetAppCollaborators.done())
    })
  })
  context('with team', function () {
    afterEach(function () {
      return nock.cleanAll()
    })
    it('shows the app collaborators and hides the team collaborator record', function () {
      const apiGetTeamApp = teamApp()
      const apiGetOrgMembers = teamMembers()
      const apiGetAppPermissions = appPermissions()
      const apiGetTeamAppCollaboratorsWithPermissions = teamAppCollaboratorsWithPermissions()
      return runCommand(Cmd, [
        '--app',
        'myapp',
      ])
        .then(() => expect(removeAllWhitespace(stdout.output)).to.contain(removeAllWhitespace('bob@heroku.com   member deploy, view                  \n gandalf@heroku.com admin  deploy, manage, operate, view \n')))
        .then(() => expect('').to.eq(stderr.output))
        .then(() => apiGetTeamApp.done())
        .then(() => apiGetOrgMembers.done())
        .then(() => apiGetAppPermissions.done())
        .then(() => apiGetTeamAppCollaboratorsWithPermissions.done())
    })
  })
})

*/
