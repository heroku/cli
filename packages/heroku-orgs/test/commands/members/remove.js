'use strict'
/* globals describe it beforeEach afterEach cli nock expect context */

let cmd = require('../../../commands/members/remove')
let stubDelete = require('../../stub/delete')
let stubGet = require('../../stub/get')

describe('heroku members:remove', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  context('from an org', () => {
    beforeEach(() => {
      stubGet.orgInfo('enterprise')
    })

    it('removes a member from an org', () => {
      let apiRemoveMemberFromOrg = stubDelete.memberFromOrg()
      return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Removing foo@foo.com from myorg... done\n`).to.eq(cli.stderr))
        .then(() => apiRemoveMemberFromOrg.done())
    })
  })

  context('from a team', () => {
    beforeEach(() => {
      stubGet.orgInfo('team')
    })

    context('without the feature flag team-invite-acceptance', () => {
      beforeEach(() => {
        stubGet.orgFeatures([])
      })

      context('using --org instead of --team', () => {
        it('removes the member, but it shows a warning about the usage of -t instead', () => {
          let apiRemoveMemberFromOrg = stubDelete.memberFromOrg()
          return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {}})
            .then(() => expect('').to.eq(cli.stdout))
            .then(() => expect(`Removing foo@foo.com from myorg... done
 ▸    myorg is a Heroku Team
 ▸    Heroku CLI now supports Heroku Teams.
 ▸    Use -t or --team for teams like myorg\n`).to.eq(cli.stderr))
            .then(() => apiRemoveMemberFromOrg.done())
        })
      })

      it('removes a member from an org', () => {
        let apiRemoveMemberFromOrg = stubDelete.memberFromOrg()
        return cmd.run({args: {email: 'foo@foo.com'}, flags: {team: 'myorg'}})
          .then(() => expect('').to.eq(cli.stdout))
          .then(() => expect(`Removing foo@foo.com from myorg... done\n`).to.eq(cli.stderr))
          .then(() => apiRemoveMemberFromOrg.done())
      })
    })

    context('with the feature flag team-invite-acceptance', () => {
      let apiGetTeamInvites

      beforeEach(() => {
        stubGet.orgFeatures([{name: 'team-invite-acceptance', enabled: true}])
      })

      context('with no pending invites', () => {
        beforeEach(() => {
          apiGetTeamInvites = stubGet.teamInvites([])
        })

        it('removes a member', () => {
          let apiRemoveMemberFromOrg = stubDelete.memberFromOrg()
          return cmd.run({args: {email: 'foo@foo.com'}, flags: {team: 'myorg'}})
            .then(() => expect('').to.eq(cli.stdout))
            .then(() => expect(`Removing foo@foo.com from myorg... done\n`).to.eq(cli.stderr))
            .then(() => apiGetTeamInvites.done())
            .then(() => apiRemoveMemberFromOrg.done())
        })
      })

      context('with pending invites', () => {
        beforeEach(() => {
          apiGetTeamInvites = stubGet.teamInvites([
            { user: { email: 'foo@foo.com' } }
          ])
        })

        it('revokes the invite', () => {
          let apiRevokeTeamInvite = stubDelete.teamInvite('foo@foo.com')

          return cmd.run({args: {email: 'foo@foo.com'}, flags: {team: 'myorg'}})
            .then(() => expect('').to.eq(cli.stdout))
            .then(() => expect(`Revoking invite for foo@foo.com in myorg... done\n`).to.eq(cli.stderr))
            .then(() => apiGetTeamInvites.done())
            .then(() => apiRevokeTeamInvite.done())
        })
      })
    })
  })
})
