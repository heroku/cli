'use strict'
/* globals describe it beforeEach afterEach context cli nock expect */

let cmd = require('../../../commands/access')[0]
let stubGet = require('../../stub/get')

describe('heroku access', () => {
  context('with personal app', () => {
    beforeEach(() => cli.mockConsole())
    afterEach(() => nock.cleanAll())

    it('shows the app collaborators', async () => {
      let apiGetPersonalApp = stubGet.personalApp()
      let apiGetAppCollaborators = stubGet.appCollaborators()

      await cmd.run({ app: 'myapp', flags: {} })

      expect(
          `jeff@heroku.com   collaborator
raulb@heroku.com  owner
`).to.eq(cli.stdout);

      expect('').to.eq(cli.stderr);
      apiGetPersonalApp.done();

      return apiGetAppCollaborators.done()
    })
  })

  context('with team', () => {
    beforeEach(() => cli.mockConsole())
    afterEach(() => nock.cleanAll())

    it('shows the app collaborators and hides the team collaborator record', async () => {
      let apiGetteamApp = stubGet.teamApp()
      let apiGetOrgMembers = stubGet.teamMembers()
      let apiGetAppPermissions = stubGet.appPermissions()
      let apiGetteamAppCollaboratorsWithPermissions = stubGet.teamAppCollaboratorsWithPermissions()

      await cmd.run({ app: 'myapp', flags: {} })

      expect(
          `bob@heroku.com    member  deploy,view
raulb@heroku.com  admin   deploy,manage,operate,view
`).to.eq(cli.stdout);

      expect('').to.eq(cli.stderr);
      apiGetteamApp.done();
      apiGetOrgMembers.done();
      apiGetAppPermissions.done();

      return apiGetteamAppCollaboratorsWithPermissions.done()
    })
  })
})
