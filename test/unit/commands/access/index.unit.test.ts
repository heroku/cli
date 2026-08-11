import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/access/index.js'
import {
  appCollaborators,
  appCollaboratorsWithPermissions,
  appPermissions,
  ownerlessApp,
  personalApp,
  teamApp,
  teamAppCollaboratorsWithPermissions,
  teamMembers,
  teamServiceAccountApp,
} from '../../../helpers/stubs/get.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('heroku access', function () {
  context('with personal app', function () {
    afterEach(function () {
      return nock.cleanAll()
    })
    it('shows the app collaborators', async function () {
      const apiGetPersonalApp = personalApp()
      const apiGetAppCollaborators = appCollaborators()
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(removeAllWhitespace(stdout)).to.contain(removeAllWhitespace('frodo@heroku.com  collaborator \n gandalf@heroku.com owner'))
      expect('').to.eq(stderr)
      apiGetPersonalApp.done()
      apiGetAppCollaborators.done()
    })
  })
  context('with team', function () {
    afterEach(function () {
      return nock.cleanAll()
    })
    it('shows the app collaborators and hides the team collaborator record', async function () {
      const apiGetTeamApp = teamApp()
      const apiGetOrgMembers = teamMembers()
      const apiGetAppPermissions = appPermissions()
      const apiGetTeamAppCollaboratorsWithPermissions = teamAppCollaboratorsWithPermissions()
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(removeAllWhitespace(stdout)).to.contain(removeAllWhitespace('bob@heroku.com   member deploy, view                  \n gandalf@heroku.com admin  deploy, manage, operate, view \n'))
      expect('').to.eq(stderr)
      apiGetTeamApp.done()
      apiGetOrgMembers.done()
      apiGetAppPermissions.done()
      apiGetTeamAppCollaboratorsWithPermissions.done()
    })
  })
  context('with a team service account owned app', function () {
    afterEach(function () {
      return nock.cleanAll()
    })
    // The owner email (myteam+service@herokumanager.com) looks team-ish, but the
    // Platform API treats service accounts as non-team, so it sends no permissions.
    // The permissions column must track what the API actually sent, not the email.
    // A service-account-owned app is not a team app per the API (it sends no
    // `team` and no permissions), so detection keyed on `app.team` matches the
    // API and the permissions column stays hidden.
    it('does not show the permissions column', async function () {
      const apiGetServiceAccountApp = teamServiceAccountApp()
      const apiGetAppCollaborators = appCollaborators()
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(removeAllWhitespace(stdout)).to.contain(removeAllWhitespace('frodo@heroku.com  collaborator \n gandalf@heroku.com owner'))
      expect(stdout.toLowerCase()).to.not.contain('permissions')
      expect('').to.eq(stderr)
      apiGetServiceAccountApp.done()
      apiGetAppCollaborators.done()
    })
  })
  context('with a team app whose owner is missing from the response', function () {
    afterEach(function () {
      return nock.cleanAll()
    })
    // The API omitted the owner but still sent permissions (it's a real team app).
    // The column must be driven by the permissions the API sent, not the owner email.
    it('shows the permissions column', async function () {
      const apiGetOwnerlessApp = ownerlessApp()
      const apiGetAppCollaborators = appCollaboratorsWithPermissions()
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(removeAllWhitespace(stdout)).to.contain(removeAllWhitespace('bob@heroku.com  member deploy, view'))
      expect(stdout.toLowerCase()).to.contain('permissions')
      expect('').to.eq(stderr)
      apiGetOwnerlessApp.done()
      apiGetAppCollaborators.done()
    })
  })
})
