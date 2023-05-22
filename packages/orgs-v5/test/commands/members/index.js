'use strict'
/* globals beforeEach afterEach cli nock expect context */

let cmd = require('../../../commands/members')
let stubGet = require('../../stub/get')

describe('heroku members', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  let apiGetOrgMembers

  it('is configured for an optional team flag', function () {
    expect(cmd).to.have.own.property('wantsOrg', true)
  })

  context('when it is an Enterprise team', () => {
    beforeEach(() => {
      stubGet.teamInfo('enterprise')
    })

    it('shows there are not team members if it is an orphan team', () => {
      apiGetOrgMembers = stubGet.teamMembers([])
      return cmd.run({flags: {team: 'myteam'}})
        .then(() => expect(
          `No members in myteam
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetOrgMembers.done())
    })

    it('shows all the team members', () => {
      apiGetOrgMembers = stubGet.teamMembers([
        {email: 'a@heroku.com', role: 'admin'}, {email: 'b@heroku.com', role: 'collaborator'},
      ])
      return cmd.run({flags: {team: 'myteam'}})
        .then(() => expect(
          `a@heroku.com  admin
b@heroku.com  collaborator
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetOrgMembers.done())
    })

    let expectedOrgMembers = [{email: 'a@heroku.com', role: 'admin'}, {email: 'b@heroku.com', role: 'member'}]

    it('filters members by role', () => {
      apiGetOrgMembers = stubGet.teamMembers(expectedOrgMembers)
      return cmd.run({flags: {team: 'myteam', role: 'member'}})
        .then(() => expect(
          `b@heroku.com  member
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetOrgMembers.done())
    })

    it("shows the right message when filter doesn't return results", () => {
      apiGetOrgMembers = stubGet.teamMembers(expectedOrgMembers)
      return cmd.run({flags: {team: 'myteam', role: 'collaborator'}})
        .then(() => expect(
          `No members in myteam with role collaborator
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetOrgMembers.done())
    })

    it('filters members by role', () => {
      apiGetOrgMembers = stubGet.teamMembers(expectedOrgMembers)
      return cmd.run({flags: {team: 'myteam', role: 'member'}})
        .then(() => expect(
          `b@heroku.com  member
`).to.eq(cli.stdout))
        .then(() => expect('').to.eq(cli.stderr))
        .then(() => apiGetOrgMembers.done())
    })
  })

  context('when it is a team', () => {
    beforeEach(() => {
      stubGet.teamInfo('team')
    })

    context('without the feature flag team-invite-acceptance', () => {
      beforeEach(() => {
        stubGet.teamFeatures([])
      })
    })

    context('with the feature flag team-invite-acceptance', () => {
      beforeEach(() => {
        stubGet.teamFeatures([{name: 'team-invite-acceptance', enabled: true}])
      })

      it('shows all members including those with pending invites', () => {
        let apiGetTeamInvites = stubGet.teamInvites()

        apiGetOrgMembers = stubGet.teamMembers([
          {email: 'a@heroku.com', role: 'admin'}, {email: 'b@heroku.com', role: 'collaborator'},
        ])

        return cmd.run({flags: {team: 'myteam'}})
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

        apiGetOrgMembers = stubGet.teamMembers([
          {email: 'a@heroku.com', role: 'admin'}, {email: 'b@heroku.com', role: 'collaborator'},
        ])

        return cmd.run({flags: {team: 'myteam', pending: true}})
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
