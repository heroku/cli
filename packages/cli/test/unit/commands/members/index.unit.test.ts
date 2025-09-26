import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import nock from 'nock'
import Cmd from '../../../../src/commands/members/index.js'
import runCommand from '../../../helpers/runCommand.js'
import {
  teamInfo,
  teamInvites,
  teamFeatures,
  teamMembers,
} from '../../../helpers/stubs/get.js'

describe('heroku members', function () {
  afterEach(function () {
    return nock.cleanAll()
  })
  let apiGetOrgMembers: nock.Scope
  const adminTeamMember = {email: 'admin@heroku.com', role: 'admin', user: {email: 'admin@heroku.com'}}
  const collaboratorTeamMember = {email: 'collab@heroku.com', role: 'collaborator', user: {email: 'collab@heroku.com'}}
  const memberTeamMember = {email: 'member@heroku.com', role: 'member', user: {email: 'member@heroku.com'}}
  context('when it is an Enterprise team', function () {
    beforeEach(function () {
      teamInfo('enterprise')
    })
    it('shows there are not team members if it is an orphan team', function () {
      apiGetOrgMembers = teamMembers([])
      return runCommand(Cmd, [
        '--team',
        'myteam',
      ])
        .then(() => expect('No members in myteam\n').to.eq(stdout.output))
        .then(() => expect('').to.eq(stderr.output))
        .then(() => apiGetOrgMembers.done())
    })
    it('shows all the team members', function () {
      apiGetOrgMembers = teamMembers([adminTeamMember, collaboratorTeamMember])
      return runCommand(Cmd, [
        '--team',
        'myteam',
      ])
        .then(() => expect(stdout.output).to.contain('admin@heroku.com  admin        \n collab@heroku.com collaborator'))
        .then(() => expect('').to.eq(stderr.output))
        .then(() => apiGetOrgMembers.done())
    })
    it('filters members by role', function () {
      apiGetOrgMembers = teamMembers([adminTeamMember, memberTeamMember])
      return runCommand(Cmd, [
        '--team',
        'myteam',
        '--role',
        'member',
      ])
        .then(() => expect(stdout.output).to.contain('member@heroku.com member'))
        .then(() => expect('').to.eq(stderr.output))
        .then(() => apiGetOrgMembers.done())
    })
    it("shows the right message when filter doesn't return results", function () {
      apiGetOrgMembers = teamMembers([adminTeamMember, memberTeamMember])
      return runCommand(Cmd, [
        '--team',
        'myteam',
        '--role',
        'collaborator',
      ])
        .then(() => expect('No members in myteam with role collaborator\n').to.eq(stdout.output))
        .then(() => expect('').to.eq(stderr.output))
        .then(() => apiGetOrgMembers.done())
    })
  })
  context('when it is a team', function () {
    beforeEach(function () {
      teamInfo('team')
    })
    context('without the feature flag team-invite-acceptance', function () {
      beforeEach(function () {
        teamFeatures([])
      })
      it('does not show the status column', function () {
        apiGetOrgMembers = teamMembers([adminTeamMember, memberTeamMember])
        return runCommand(Cmd, [
          '--team',
          'myteam',
        ])
          .then(() => expect(stdout.output).to.not.contain('Status'))
          .then(() => apiGetOrgMembers.done())
      })
    })
    context('with the feature flag team-invite-acceptance', function () {
      beforeEach(function () {
        teamFeatures([{name: 'team-invite-acceptance', enabled: true}])
      })
      it('shows all members including those with pending invites', function () {
        const apiGetTeamInvites = teamInvites()
        apiGetOrgMembers = teamMembers([adminTeamMember, collaboratorTeamMember])
        return runCommand(Cmd, [
          '--team',
          'myteam',
        ])
          .then(() => expect(stdout.output).to.contain('admin@heroku.com      admin                \n collab@heroku.com     collaborator         \n invited-user@mail.com admin        pending'))
          .then(() => expect('').to.eq(stderr.output))
          .then(() => apiGetTeamInvites.done())
          .then(() => apiGetOrgMembers.done())
      })
      it('does not show the Status column when there are no pending invites', function () {
        const apiGetTeamInvites = teamInvites([])
        apiGetOrgMembers = teamMembers([adminTeamMember, collaboratorTeamMember])
        return runCommand(Cmd, [
          '--team',
          'myteam',
        ])
          .then(() => expect(stdout.output).to.not.contain('Status'))
          .then(() => apiGetOrgMembers.done())
          .then(() => apiGetTeamInvites.done())
      })
      it('filters members by pending invites', function () {
        const apiGetTeamInvites = teamInvites()
        apiGetOrgMembers = teamMembers([adminTeamMember, collaboratorTeamMember])
        return runCommand(Cmd, [
          '--team',
          'myteam',
          '--pending',
        ])
          .then(() => expect(stdout.output).to.contain('invited-user@mail.com admin pending'))
          .then(() => expect('').to.eq(stderr.output))
          .then(() => apiGetTeamInvites.done())
          .then(() => apiGetOrgMembers.done())
      })
    })
  })
})
