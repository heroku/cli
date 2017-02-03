'use strict'
/* globals describe it beforeEach afterEach context cli nock expect */

let cmd = require('../../../commands/access')[0]
let stubGet = require('../../stub/get')

describe('heroku access', () => {
  context('with personal app', () => {
    beforeEach(() => cli.mockConsole())
    afterEach(() => nock.cleanAll())

    it('shows the app collaborators', () => {
      let apiGetPersonalApp = stubGet.personalApp()
      let apiGetAppCollaborators = stubGet.appCollaborators()

      return cmd.run({app: 'myapp', flags: {}})
        .then(() => expect(
          `jeff@heroku.com   collaborator
raulb@heroku.com  owner
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetPersonalApp.done())
        .then(() => apiGetAppCollaborators.done())
    })
  })

  context('with organization/team', () => {
    beforeEach(() => cli.mockConsole())
    afterEach(() => nock.cleanAll())

    it('shows the app collaborators and hides the org collaborator record', () => {
      let apiGetOrgApp = stubGet.orgApp()
      let apiGetOrgMembers = stubGet.orgMembers()
      let apiGetAppPermissions = stubGet.appPermissions()
      let apiGetOrgAppCollaboratorsWithPermissions = stubGet.orgAppCollaboratorsWithPermissions()

      return cmd.run({app: 'myapp', flags: {}})
        .then(() => expect(
          `bob@heroku.com    member  deploy,view
raulb@heroku.com  admin   deploy,manage,operate,view
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetOrgApp.done())
        .then(() => apiGetOrgMembers.done())
        .then(() => apiGetAppPermissions.done())
        .then(() => apiGetOrgAppCollaboratorsWithPermissions.done())
    })
  })
})
