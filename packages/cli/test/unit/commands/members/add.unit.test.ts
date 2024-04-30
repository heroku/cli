import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import * as nock from 'nock'
import Cmd  from '../../../../src/commands/members/add'
import runCommand from '../../../helpers/runCommand'
import {sendInvite, updateMemberRole} from '../../../helpers/stubs/put'
import {
  teamFeatures,
  teamInfo,
  variableSizeTeamInvites,
  variableSizeTeamMembers,
} from '../../../helpers/stubs/get'

describe('heroku members:add', function () {
  let apiUpdateMemberRole: nock.Scope

  afterEach(function () {
    return nock.cleanAll()
  })

  context('without the feature flag team-invite-acceptance', function () {
    beforeEach(function () {
      teamFeatures([])
    })
    context('and group is an enterprise org', function () {
      beforeEach(function () {
        teamInfo('enterprise')
        variableSizeTeamMembers(1)
      })
      it('adds a member to an org', function () {
        apiUpdateMemberRole = updateMemberRole('foo@foo.com', 'admin')
        return runCommand(Cmd, [
          '--team',
          'myteam',
          '--role',
          'admin',
          'foo@foo.com',
        ])
          .then(() => expect('').to.eq(stdout.output))
          .then(() => expect('Adding foo@foo.com to myteam as admin...\nAdding foo@foo.com to myteam as admin... done\n').to.eq(stderr.output))
          .then(() => apiUpdateMemberRole.done())
      })
    })
  })
  context('with the feature flag team-invite-acceptance for a team', function () {
    beforeEach(function () {
      teamFeatures([{name: 'team-invite-acceptance', enabled: true}])
      teamInfo('team')
    })
    it('sends an invite when adding a new user to the team', function () {
      const apiSendInvite = sendInvite('foo@foo.com', 'admin')
      variableSizeTeamMembers(1)
      variableSizeTeamInvites(0)
      return runCommand(Cmd, [
        '--role',
        'admin',
        '--team',
        'myteam',
        'foo@foo.com',
      ])
        .then(() => expect('').to.eq(stdout.output))
        .then(() => expect('Inviting foo@foo.com to myteam as admin...\nInviting foo@foo.com to myteam as admin... done\n').to.eq(stderr.output))
        .then(() => apiSendInvite.done())
    })
  })
})
