'use strict'
/* globals beforeEach afterEach cli nock expect context */

let cmd = require('../../../commands/members/set')
let stubGet = require('../../stub/get')
let stubPatch = require('../../stub/patch')
const unwrap = require('../../unwrap')

describe('heroku members:set', () => {
  let apiUpdateMemberRole

  beforeEach(() => {
    cli.mockConsole()
    stubGet.teamFeatures([])
  })
  afterEach(() => nock.cleanAll())

  it('is configured for an optional team flag', function () {
    expect(cmd).to.have.own.property('wantsOrg', true)
  })

  context('and group is a team', () => {
    beforeEach(() => {
      stubGet.teamInfo('team')
    })

    it('does not warn the user when under the free org limit', () => {
      stubGet.variableSizeTeamMembers(1)
      stubGet.variableSizeTeamInvites(0)
      apiUpdateMemberRole = stubPatch.updateMemberRole('foo@foo.com', 'admin')

      return cmd.run({args: {email: 'foo@foo.com'}, flags: {role: 'admin', team: 'myteam'}})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding foo@foo.com to myteam as admin... done
`).to.eq(cli.stderr))
        .then(() => apiUpdateMemberRole.done())
    })

    it('does not warn the user when over the free org limit', () => {
      stubGet.variableSizeTeamMembers(7)
      stubGet.variableSizeTeamInvites(0)
      apiUpdateMemberRole = stubPatch.updateMemberRole('foo@foo.com', 'admin')

      return cmd.run({args: {email: 'foo@foo.com'}, flags: {role: 'admin', team: 'myteam'}})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding foo@foo.com to myteam as admin... done
`).to.eq(cli.stderr))
        .then(() => apiUpdateMemberRole.done())
    })

    it('does warn the user when at the free org limit', () => {
      stubGet.variableSizeTeamMembers(6)
      stubGet.variableSizeTeamInvites(0)
      apiUpdateMemberRole = stubPatch.updateMemberRole('foo@foo.com', 'admin')

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
      apiUpdateMemberRole = stubPatch.updateMemberRole('foo@foo.com', 'admin')

      return cmd.run({args: {email: 'foo@foo.com'}, flags: {team: 'myteam', role: 'admin'}})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding foo@foo.com to myteam as admin... done
`).to.eq(cli.stderr))
        .then(() => apiUpdateMemberRole.done())
    })
  })
})
