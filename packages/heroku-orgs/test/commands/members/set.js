'use strict'
/* globals describe it beforeEach afterEach cli nock expect context */

let cmd = require('../../../commands/members/set')
let stubGet = require('../../stub/get')
let stubPatch = require('../../stub/patch')

describe('heroku members:set', () => {
  let apiUpdateMemberRole

  beforeEach(() => {
    cli.mockConsole()
    stubGet.orgFeatures([])
  })
  afterEach(() => nock.cleanAll())

  context('and group is a team', () => {
    beforeEach(() => {
      stubGet.orgInfo('team')
    })

    it('does not warn the user when under the free org limit', () => {
      stubGet.variableSizeOrgMembers(1)
      stubGet.variableSizeTeamInvites(0)
      apiUpdateMemberRole = stubPatch.updateMemberRole('foo@foo.com', 'admin')

      return cmd.run({args: {email: 'foo@foo.com'}, flags: {role: 'admin', team: 'myorg'}})
      .then(() => expect('').to.eq(cli.stdout))
      .then(() => expect(`Adding foo@foo.com to myorg as admin... done
`).to.eq(cli.stderr))
      .then(() => apiUpdateMemberRole.done())
    })

    it('does not warn the user when over the free org limit', () => {
      stubGet.variableSizeOrgMembers(7)
      stubGet.variableSizeTeamInvites(0)
      apiUpdateMemberRole = stubPatch.updateMemberRole('foo@foo.com', 'admin')

      return cmd.run({args: {email: 'foo@foo.com'}, flags: {role: 'admin', team: 'myorg'}})
      .then(() => expect('').to.eq(cli.stdout))
      .then(() => expect(`Adding foo@foo.com to myorg as admin... done
`).to.eq(cli.stderr))
      .then(() => apiUpdateMemberRole.done())
    })

    it('does warn the user when at the free org limit', () => {
      stubGet.variableSizeOrgMembers(6)
      stubGet.variableSizeTeamInvites(0)
      apiUpdateMemberRole = stubPatch.updateMemberRole('foo@foo.com', 'admin')

      return cmd.run({args: {email: 'foo@foo.com'}, flags: {role: 'admin', team: 'myorg'}})
      .then(() => expect('').to.eq(cli.stdout))
      .then(() => expect(`Adding foo@foo.com to myorg as admin... done
 ▸    You'll be billed monthly for teams over 5 members.\n`).to.eq(cli.stderr))
      .then(() => apiUpdateMemberRole.done())
    })

    context('using --org instead of --team', () => {
      it('adds the member, but it shows a warning about the usage of -t instead', () => {
        stubGet.variableSizeOrgMembers(1)
        stubGet.variableSizeTeamInvites(0)

        apiUpdateMemberRole = stubPatch.updateMemberRole('foo@foo.com', 'admin')
        return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {role: 'admin'}})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding foo@foo.com to myorg as admin... done
 ▸    myorg is a Heroku Team\n ▸    Heroku CLI now supports Heroku Teams.\n ▸    Use -t or --team for teams like myorg\n`).to.eq(cli.stderr))
          .then(() => apiUpdateMemberRole.done())
      })
    })
  })

  context('and group is an enterprise org', () => {
    beforeEach(() => {
      stubGet.orgInfo('enterprise')
      stubGet.variableSizeOrgMembers(1)
    })

    it('adds a member to an org', () => {
      apiUpdateMemberRole = stubPatch.updateMemberRole('foo@foo.com', 'admin')

      return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {role: 'admin'}})
      .then(() => expect('').to.eq(cli.stdout))
      .then(() => expect(`Adding foo@foo.com to myorg as admin... done
`).to.eq(cli.stderr))
      .then(() => apiUpdateMemberRole.done())
    })
  })
})
