'use strict'
/* globals beforeEach afterEach cli nock expect context */

let cmd = require('../../../../commands/members/add')
let stubGet = require('../../stub/get')
let stubPut = require('../../stub/put')
const unwrap = require('../../../unwrap')

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
