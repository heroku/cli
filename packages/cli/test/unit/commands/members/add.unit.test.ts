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

describe('heroku members:add', () => {
  let apiUpdateMemberRole: nock.Scope
  afterEach(() => nock.cleanAll())

  context('without the feature flag team-invite-acceptance', () => {
    beforeEach(() => {
      teamFeatures([])
    })
    context('and group is an enterprise org', () => {
      beforeEach(() => {
        teamInfo('enterprise')
        variableSizeTeamMembers(1)
      })
      it('adds a member to an org', () => {
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
  context('with the feature flag team-invite-acceptance for a team', () => {
    beforeEach(() => {
      teamFeatures([{name: 'team-invite-acceptance', enabled: true}])
      teamInfo('team')
    })
    it('sends an invite when adding a new user to the team', () => {
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
