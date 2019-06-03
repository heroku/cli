'use strict'
/* globals describe it beforeEach afterEach cli nock expect context */

let cmd = require('../../../commands/members/remove')
let stubDelete = require('../../stub/delete')
let stubGet = require('../../stub/get')
const unwrap = require('../../unwrap')

describe('heroku members:remove', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('is is configured for an optional team/org flag', function () {
    expect(cmd).to.have.own.property('wantsOrg', true)
  })

  context('from an org', () => {
    beforeEach(() => {
      stubGet.teamInfo('enterprise')
    })

    it('removes a member from an org', () => {
      let apiRemoveMemberFromOrg = stubDelete.memberFromTeam()
      return cmd.run({ org: 'myteam', args: { email: 'foo@foo.com' } })
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Removing foo@foo.com from myteam... done\n`).to.eq(cli.stderr))
        .then(() => apiRemoveMemberFromOrg.done())
    })
  })

  context('from a team', () => {
    beforeEach(() => {
      stubGet.teamInfo('team')
    })

    context('without the feature flag team-invite-acceptance', () => {
      beforeEach(() => {
        stubGet.teamFeatures([])
      })

      context('using --org instead of --team', () => {
        it('removes the member, but it shows a warning about the usage of -t instead', () => {
          let apiRemoveMemberFromOrg = stubDelete.memberFromTeam()
          return cmd.run({ org: 'myteam', args: { email: 'foo@foo.com' }, flags: {} })
            .then(() => expect('').to.eq(cli.stdout))
            .then(() => expect(unwrap(cli.stderr)).to.equal(`Removing foo@foo.com from myteam... done \
myteam is a Heroku Team Heroku CLI now supports Heroku Teams. Use -t or --team for teams like myteam
`))
            .then(() => apiRemoveMemberFromOrg.done())
        })
      })

      it('removes a member from an org', () => {
        let apiRemoveMemberFromOrg = stubDelete.memberFromTeam()
        return cmd.run({ args: { email: 'foo@foo.com' }, flags: { team: 'myteam' } })
          .then(() => expect('').to.eq(cli.stdout))
          .then(() => expect(`Removing foo@foo.com from myteam... done\n`).to.eq(cli.stderr))
          .then(() => apiRemoveMemberFromOrg.done())
      })
    })

    context('with the feature flag team-invite-acceptance', () => {
      let apiGetTeamInvites

      beforeEach(() => {
        stubGet.teamFeatures([{ name: 'team-invite-acceptance', enabled: true }])
      })

      context('with no pending invites', () => {
        beforeEach(() => {
          apiGetTeamInvites = stubGet.teamInvites([])
        })

        it('removes a member', () => {
          let apiRemoveMemberFromOrg = stubDelete.memberFromTeam()
          return cmd.run({ args: { email: 'foo@foo.com' }, flags: { team: 'myteam' } })
            .then(() => expect('').to.eq(cli.stdout))
            .then(() => expect(`Removing foo@foo.com from myteam... done\n`).to.eq(cli.stderr))
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

          return cmd.run({ args: { email: 'foo@foo.com' }, flags: { team: 'myteam' } })
            .then(() => expect('').to.eq(cli.stdout))
            .then(() => expect(`Revoking invite for foo@foo.com in myteam... done\n`).to.eq(cli.stderr))
            .then(() => apiGetTeamInvites.done())
            .then(() => apiRevokeTeamInvite.done())
        })
      })
    })
  })
})
