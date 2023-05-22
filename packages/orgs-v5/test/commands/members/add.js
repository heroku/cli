'use strict'
/* globals beforeEach afterEach cli nock expect context */

let cmd = require('../../../commands/members/add')
let stubGet = require('../../stub/get')
let stubPut = require('../../stub/put')
const unwrap = require('../../unwrap')

describe('heroku members:add', () => {
  let apiUpdateMemberRole

  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('is configured for an optional team flag', function () {
    expect(cmd).to.have.own.property('wantsOrg', true)
  })

  context('without the feature flag team-invite-acceptance', () => {
    beforeEach(() => {
      stubGet.teamFeatures([])
    })

    context('and group is a team', () => {
      beforeEach(() => {
        stubGet.teamInfo('team')
      })

      it('does not warn the user when under the free org limit', () => {
        stubGet.variableSizeTeamMembers(1)
        stubGet.variableSizeTeamInvites(0)
        apiUpdateMemberRole = stubPut.updateMemberRole('foo@foo.com', 'admin')

        return cmd.run({args: {email: 'foo@foo.com'}, flags: {role: 'admin', team: 'myteam'}})
          .then(() => expect('').to.eq(cli.stdout))
          .then(() => expect(`Adding foo@foo.com to myteam as admin... done
`).to.eq(cli.stderr))
          .then(() => apiUpdateMemberRole.done())
      })

      it('does not warn the user when over the free org limit', () => {
        stubGet.variableSizeTeamMembers(7)
        stubGet.variableSizeTeamInvites(0)
        apiUpdateMemberRole = stubPut.updateMemberRole('foo@foo.com', 'admin')

        return cmd.run({args: {email: 'foo@foo.com'}, flags: {role: 'admin', team: 'myteam'}})
          .then(() => expect('').to.eq(cli.stdout))
          .then(() => expect(`Adding foo@foo.com to myteam as admin... done
`).to.eq(cli.stderr))
          .then(() => apiUpdateMemberRole.done())
      })

      it('does warn the user when at the free org limit', () => {
        stubGet.variableSizeTeamMembers(6)
        stubGet.variableSizeTeamInvites(0)
        apiUpdateMemberRole = stubPut.updateMemberRole('foo@foo.com', 'admin')

        return cmd.run({args: {email: 'foo@foo.com'}, flags: {role: 'admin', team: 'myteam'}})
          .then(() => expect('').to.eq(cli.stdout))
          .then(() => expect(unwrap(cli.stderr)).to.equal(`Adding foo@foo.com to myteam as admin... done \
You'll be billed monthly for teams over 5 members.
`))
          .then(() => apiUpdateMemberRole.done())
      })
    })

    context('and group is an enterprise org', () => {
      beforeEach(() => {
        stubGet.teamInfo('enterprise')
        stubGet.variableSizeTeamMembers(1)
      })

      it('adds a member to an org', () => {
        apiUpdateMemberRole = stubPut.updateMemberRole('foo@foo.com', 'admin')

        return cmd.run({args: {email: 'foo@foo.com'}, flags: {team: 'myteam', role: 'admin'}})
          .then(() => expect('').to.eq(cli.stdout))
          .then(() => expect(`Adding foo@foo.com to myteam as admin... done
`).to.eq(cli.stderr))
          .then(() => apiUpdateMemberRole.done())
      })
    })
  })

  context('with the feature flag team-invite-acceptance for a team', () => {
    beforeEach(() => {
      stubGet.teamFeatures([{name: 'team-invite-acceptance', enabled: true}])
      stubGet.teamInfo('team')
    })

    it('does warn the user when free org limit is caused by invites', () => {
      let apiSendInvite = stubPut.sendInvite('foo@foo.com', 'admin')

      let apiGetOrgMembers = stubGet.variableSizeTeamMembers(1)
      let apiGetTeamInvites = stubGet.variableSizeTeamInvites(5)

      return cmd.run({args: {email: 'foo@foo.com'}, flags: {role: 'admin', team: 'myteam'}})
        .then(() => apiSendInvite.done())
        .then(() => apiGetOrgMembers.done())
        .then(() => apiGetTeamInvites.done())
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(unwrap(cli.stderr)).to.equal(`Inviting foo@foo.com to myteam as admin... email sent \
You'll be billed monthly for teams over 5 members.
`))
    })

    it('sends an invite when adding a new user to the team', () => {
      let apiSendInvite = stubPut.sendInvite('foo@foo.com', 'admin')

      stubGet.variableSizeTeamMembers(1)
      stubGet.variableSizeTeamInvites(0)

      return cmd.run({args: {email: 'foo@foo.com'}, flags: {role: 'admin', team: 'myteam'}})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect('Inviting foo@foo.com to myteam as admin... email sent\n').to.eq(cli.stderr))
        .then(() => apiSendInvite.done())
    })
  })
})
