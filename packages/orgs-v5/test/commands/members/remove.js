'use strict'
/* globals describe it beforeEach afterEach cli nock expect context */

let cmd = require('../../../commands/members/remove')
let stubDelete = require('../../stub/delete')
let stubGet = require('../../stub/get')

describe('heroku members:remove', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('is configured for an optional team flag', function () {
    expect(cmd).to.have.own.property('wantsOrg', true)
  })

  context('from an org', () => {
    beforeEach(() => {
      stubGet.teamInfo('enterprise')
    })

    it('removes a member from an org', async () => {
      let apiRemoveMemberFromOrg = stubDelete.memberFromTeam()

      await cmd.run({ flags: { team: 'myteam' }, args: { email: 'foo@foo.com' } })

      expect('').to.eq(cli.stdout);
      expect(`Removing foo@foo.com from myteam... done\n`).to.eq(cli.stderr);

      return apiRemoveMemberFromOrg.done()
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

      it('removes a member from an org', async () => {
        let apiRemoveMemberFromOrg = stubDelete.memberFromTeam()

        await cmd.run({ args: { email: 'foo@foo.com' }, flags: { team: 'myteam' } })

        expect('').to.eq(cli.stdout);
        expect(`Removing foo@foo.com from myteam... done\n`).to.eq(cli.stderr);

        return apiRemoveMemberFromOrg.done()
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

        it('removes a member', async () => {
          let apiRemoveMemberFromOrg = stubDelete.memberFromTeam()

          await cmd.run({ args: { email: 'foo@foo.com' }, flags: { team: 'myteam' } })

          expect('').to.eq(cli.stdout);
          expect(`Removing foo@foo.com from myteam... done\n`).to.eq(cli.stderr);
          apiGetTeamInvites.done();

          return apiRemoveMemberFromOrg.done()
        })
      })

      context('with pending invites', () => {
        beforeEach(() => {
          apiGetTeamInvites = stubGet.teamInvites([
            { user: { email: 'foo@foo.com' } }
          ])
        })

        it('revokes the invite', async () => {
          let apiRevokeTeamInvite = stubDelete.teamInvite('foo@foo.com')

          await cmd.run({ args: { email: 'foo@foo.com' }, flags: { team: 'myteam' } })

          expect('').to.eq(cli.stdout);
          expect(`Revoking invite for foo@foo.com in myteam... done\n`).to.eq(cli.stderr);
          apiGetTeamInvites.done();

          return apiRevokeTeamInvite.done()
        })
      })
    })
  })
})
