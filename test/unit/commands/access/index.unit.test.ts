import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/access/index.js'
import {
  appCollaborators,
  appPermissions,
  personalApp,
  teamApp,
  teamAppCollaboratorsWithPermissions,
  teamMembers,
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
})
