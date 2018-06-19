'use strict'
/* globals describe it beforeEach afterEach cli nock expect context */

let cmd = require('../../../commands/members')
let stubGet = require('../../stub/get')

describe('heroku members', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  let apiGetOrgMembers

  context('when it is an Enterprise org', () => {
    beforeEach(() => {
      stubGet.orgInfo('enterprise')
    })

    it('shows there are not org members if it is an orphan org', () => {
      apiGetOrgMembers = stubGet.orgMembers([])
      return cmd.run({org: 'myorg', flags: {}})
        .then(() => expect(
          `No members in myorg
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetOrgMembers.done())
    })

    it('shows all the org members', () => {
      apiGetOrgMembers = stubGet.orgMembers([
        {email: 'a@heroku.com', role: 'admin'}, {email: 'b@heroku.com', role: 'collaborator'}
      ])
      return cmd.run({org: 'myorg', flags: {}})
        .then(() => expect(
          `a@heroku.com  admin
b@heroku.com  collaborator
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetOrgMembers.done())
    })

    let expectedOrgMembers = [{email: 'a@heroku.com', role: 'admin'}, {email: 'b@heroku.com', role: 'member'}]

    it('filters members by role', () => {
      apiGetOrgMembers = stubGet.orgMembers(expectedOrgMembers)
      return cmd.run({org: 'myorg', flags: {role: 'member'}})
        .then(() => expect(
          `b@heroku.com  member
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetOrgMembers.done())
    })

    it("shows the right message when filter doesn't return results", () => {
      apiGetOrgMembers = stubGet.orgMembers(expectedOrgMembers)
      return cmd.run({org: 'myorg', flags: {role: 'collaborator'}})
        .then(() => expect(
          `No members in myorg with role collaborator
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetOrgMembers.done())
    })

    it('filters members by role', () => {
      apiGetOrgMembers = stubGet.orgMembers(expectedOrgMembers)
      return cmd.run({org: 'myorg', flags: {role: 'member'}})
        .then(() => expect(
          `b@heroku.com  member
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetOrgMembers.done())
    })
  })

  context('when it is a team', () => {
    beforeEach(() => {
      stubGet.orgInfo('team')
    })

    context('without the feature flag team-invite-acceptance', () => {
      beforeEach(() => {
        stubGet.orgFeatures([])
      })

      context('using --org instead of --team', () => {
        it('shows members either way including a warning', () => {
          apiGetOrgMembers = stubGet.orgMembers([
            {email: 'a@heroku.com', role: 'admin'}, {email: 'b@heroku.com', role: 'collaborator'}
          ])
          return cmd.run({org: 'myorg', flags: {}})
            .then(() => expect(
              `a@heroku.com  admin
b@heroku.com  collaborator\n`).to.eq(cli.stdout))
            .then(() => expect(' ▸    myorg is a Heroku Team\n ▸    Heroku CLI now supports Heroku Teams.\n ▸    Use -t or --team for teams like myorg\n').to.eq(cli.stderr))
            .then(() => apiGetOrgMembers.done())
        })
      })
    })

    context('with the feature flag team-invite-acceptance', () => {
      beforeEach(() => {
        stubGet.orgFeatures([{name: 'team-invite-acceptance', enabled: true}])
      })

      it('shows all members including those with pending invites', () => {
        let apiGetTeamInvites = stubGet.teamInvites()

        apiGetOrgMembers = stubGet.orgMembers([
          {email: 'a@heroku.com', role: 'admin'}, {email: 'b@heroku.com', role: 'collaborator'}
        ])

        return cmd.run({flags: {team: 'myorg'}})
          .then(() => expect(
            `a@heroku.com           admin
b@heroku.com           collaborator
invited-user@mail.com  admin         pending
`).to.eq(cli.stdout))
          .then(() => expect('').to.eq(cli.stderr))
          .then(() => apiGetTeamInvites.done())
          .then(() => apiGetOrgMembers.done())
      })

      it('filters members by pending invites', () => {
        let apiGetTeamInvites = stubGet.teamInvites()

        apiGetOrgMembers = stubGet.orgMembers([
          {email: 'a@heroku.com', role: 'admin'}, {email: 'b@heroku.com', role: 'collaborator'}
        ])

        return cmd.run({flags: {team: 'myorg', pending: true}})
          .then(() => expect(
            `invited-user@mail.com  admin  pending
`).to.eq(cli.stdout))
          .then(() => expect('').to.eq(cli.stderr))
          .then(() => apiGetTeamInvites.done())
          .then(() => apiGetOrgMembers.done())
      })
    })
  })
})
