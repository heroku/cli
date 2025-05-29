import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import nock from 'nock'

// import Cmd from '../../../../src/commands/members/remove'
import runCommand from '../../../helpers/runCommand.js'
import {
  teamFeatures,
  teamInfo,
  teamInvites,
} from '../../../helpers/stubs/get.js'
import {memberFromTeam, teamInvite} from '../../../helpers/stubs/delete.js'

/*
describe('heroku members:remove', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  context('from an org', function () {
    beforeEach(function () {
      teamInfo('enterprise')
    })
    it('removes a member from an org', function () {
      const apiRemoveMemberFromOrg = memberFromTeam()
      return runCommand(Cmd, [
        '--team',
        'myteam',
        'foo@foo.com',
      ])
        .then(() => expect('').to.eq(stdout.output))
        .then(() => expect('Removing foo@foo.com from myteam...\nRemoving foo@foo.com from myteam... done\n').to.eq(stderr.output))
        .then(() => apiRemoveMemberFromOrg.done())
    })
  })
  context('from a team', function () {
    beforeEach(function () {
      teamInfo('team')
    })
    context('without the feature flag team-invite-acceptance', function () {
      beforeEach(function () {
        teamFeatures([])
      })
      it('removes a member from an org', function () {
        const apiRemoveMemberFromOrg = memberFromTeam()
        return runCommand(Cmd, [
          '--team',
          'myteam',
          'foo@foo.com',
        ])
          .then(() => expect('').to.eq(stdout.output))
          .then(() => expect('Removing foo@foo.com from myteam...\nRemoving foo@foo.com from myteam... done\n').to.eq(stderr.output))
          .then(() => apiRemoveMemberFromOrg.done())
      })
    })
    context('with the feature flag team-invite-acceptance', function () {
      let apiGetTeamInvites: nock.Scope
      beforeEach(function () {
        teamFeatures([{name: 'team-invite-acceptance', enabled: true}])
      })
      context('with no pending invites', function () {
        beforeEach(function () {
          apiGetTeamInvites = teamInvites([])
        })
        it('removes a member', function () {
          const apiRemoveMemberFromOrg = memberFromTeam()
          return runCommand(Cmd, [
            '--team',
            'myteam',
            'foo@foo.com',
          ])
            .then(() => expect('').to.eq(stdout.output))
            .then(() => expect('Removing foo@foo.com from myteam...\nRemoving foo@foo.com from myteam... done\n').to.eq(stderr.output))
            .then(() => apiGetTeamInvites.done())
            .then(() => apiRemoveMemberFromOrg.done())
        })
      })
      context('with pending invites', function () {
        it('revokes the invite', function () {
          apiGetTeamInvites = teamInvites([
            {
              invited_by: {
                email: 'invite@foo.com',
              },
              role: 'member',
              user: {
                email: 'foo@foo.com',
              },
            },
          ])
          const apiRevokeTeamInvite = teamInvite('foo@foo.com')
          return runCommand(Cmd, [
            '--team',
            'myteam',
            'foo@foo.com',
          ])
            .then(() => expect('').to.eq(stdout.output))
            .then(() => expect('Revoking invite for foo@foo.com in myteam...\nRevoking invite for foo@foo.com in myteam... done\n').to.eq(stderr.output))
            .then(() => apiGetTeamInvites.done())
            .then(() => apiRevokeTeamInvite.done())
        })
      })
    })
  })
})

*/
