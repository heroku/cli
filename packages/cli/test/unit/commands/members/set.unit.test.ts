import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import * as nock from 'nock'
import Cmd  from '../../../../src/commands/members/set'
import runCommand from '../../../helpers/runCommand'
import {
  teamFeatures,
  teamInfo,
  variableSizeTeamInvites,
  variableSizeTeamMembers,
} from '../../../helpers/stubs/get'
import {updateMemberRole} from '../../../helpers/stubs/patch'

describe('heroku members:set', () => {
  let apiUpdateMemberRole: nock.Scope
  beforeEach(() => {
    teamFeatures([])
  })
  afterEach(() => nock.cleanAll())

  context('and group is a team', () => {
    beforeEach(() => {
      teamInfo('team')
    })
    it('does not warn the user when under the free org limit', () => {
      variableSizeTeamMembers(1)
      variableSizeTeamInvites(0)
      apiUpdateMemberRole = updateMemberRole('foo@foo.com', 'admin')
      return runCommand(Cmd, [
        '--role',
        'admin',
        '--team',
        'myteam',
        'foo@foo.com',
      ])
        .then(() => expect('').to.eq(stdout.output))
        .then(() => expect('Adding foo@foo.com to myteam as admin...\nAdding foo@foo.com to myteam as admin... done\n').to.eq(stderr.output))
        .then(() => apiUpdateMemberRole.done())
    })
    it('does not warn the user when over the free org limit', () => {
      variableSizeTeamMembers(7)
      variableSizeTeamInvites(0)
      apiUpdateMemberRole = updateMemberRole('foo@foo.com', 'admin')
      return runCommand(Cmd, [
        '--role',
        'admin',
        '--team',
        'myteam',
        'foo@foo.com',
      ])
        .then(() => expect('').to.eq(stdout.output))
        .then(() => expect('Adding foo@foo.com to myteam as admin...\nAdding foo@foo.com to myteam as admin... done\n').to.eq(stderr.output))
        .then(() => apiUpdateMemberRole.done())
    })
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
