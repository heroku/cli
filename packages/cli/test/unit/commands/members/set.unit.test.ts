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

describe('heroku members:set', function () {
  let apiUpdateMemberRole: nock.Scope

  beforeEach(function () {
    teamFeatures([])
  })

  afterEach(function () {
    return nock.cleanAll()
  })

  context('and group is a team', function () {
    beforeEach(function () {
      teamInfo('team')
    })
    it('does not warn the user when under the free org limit', function () {
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
    it('does not warn the user when over the free org limit', function () {
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
