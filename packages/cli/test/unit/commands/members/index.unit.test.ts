import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('heroku members', function () {
  const adminTeamMember = {email: 'admin@heroku.com', role: 'admin', user: {email: 'admin@heroku.com'}}
  const collaboratorTeamMember = {email: 'collab@heroku.com', role: 'collaborator', user: {email: 'collab@heroku.com'}}
  const memberTeamMember = {email: 'member@heroku.com', role: 'member', user: {email: 'member@heroku.com'}}

  afterEach(() => nock.cleanAll())

  context('when it is an Enterprise team', function () {
    it('shows there are not team members if it is an orphan team', async () => {
      nock('https://api.heroku.com')
        .get('/teams/myteam')
        .reply(200, {type: 'enterprise'})
        .get('/teams/myteam/members')
        .reply(200, [])

      const {stdout} = await runCommand(['members', '--team', 'myteam'])

      expect(stdout).to.contain('No members in myteam')
    })

    it('shows all the team members', async () => {
      nock('https://api.heroku.com')
        .get('/teams/myteam')
        .reply(200, {type: 'enterprise'})
        .get('/teams/myteam/members')
        .reply(200, [adminTeamMember, collaboratorTeamMember])

      const {stdout} = await runCommand(['members', '--team', 'myteam'])

      expect(stdout).to.contain('admin@heroku.com')
      expect(stdout).to.contain('admin')
      expect(stdout).to.contain('collab@heroku.com')
      expect(stdout).to.contain('collaborator')
    })

    it('filters members by role', async () => {
      nock('https://api.heroku.com')
        .get('/teams/myteam')
        .reply(200, {type: 'enterprise'})
        .get('/teams/myteam/members')
        .reply(200, [adminTeamMember, memberTeamMember])

      const {stdout} = await runCommand(['members', '--team', 'myteam', '--role', 'member'])

      expect(stdout).to.contain('member@heroku.com')
      expect(stdout).to.contain('member')
    })

    it("shows the right message when filter doesn't return results", async () => {
      nock('https://api.heroku.com')
        .get('/teams/myteam')
        .reply(200, {type: 'enterprise'})
        .get('/teams/myteam/members')
        .reply(200, [adminTeamMember, memberTeamMember])

      const {stdout} = await runCommand(['members', '--team', 'myteam', '--role', 'collaborator'])

      expect(stdout).to.contain('No members in myteam with role collaborator')
    })
  })

  context('when it is a team', function () {
    context('without the feature flag team-invite-acceptance', function () {
      it('does not show the Status column when there are no pending invites', async () => {
        nock('https://api.heroku.com')
          .get('/teams/myteam')
          .reply(200, {type: 'team'})
          .get('/teams/myteam/features')
          .reply(200, [])
          .get('/teams/myteam/members')
          .reply(200, [adminTeamMember, collaboratorTeamMember])

        const {stdout} = await runCommand(['members', '--team', 'myteam'])

        expect(stdout).to.not.contain('Status')
      })
    })

    context('with the feature flag team-invite-acceptance', function () {
      it('shows all members including those with pending invites', async () => {
        nock('https://api.heroku.com')
          .get('/teams/myteam')
          .reply(200, {type: 'team'})
          .get('/teams/myteam/features')
          .reply(200, [{name: 'team-invite-acceptance', enabled: true}])
          .get('/teams/myteam/invitations')
          .reply(200, [{
            user: {email: 'invited-user@mail.com'},
            role: 'admin',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          }])
          .get('/teams/myteam/members')
          .reply(200, [adminTeamMember, collaboratorTeamMember])

        const {stdout} = await runCommand(['members', '--team', 'myteam'])

        expect(stdout).to.contain('admin@heroku.com')
        expect(stdout).to.contain('admin')
        expect(stdout).to.contain('collab@heroku.com')
        expect(stdout).to.contain('collaborator')
        expect(stdout).to.contain('invited-user@mail.com')
        expect(stdout).to.contain('pending')
      })

      it('does not show the Status column when there are no pending invites', async () => {
        nock('https://api.heroku.com')
          .get('/teams/myteam')
          .reply(200, {type: 'team'})
          .get('/teams/myteam/features')
          .reply(200, [{name: 'team-invite-acceptance', enabled: true}])
          .get('/teams/myteam/invitations')
          .reply(200, [])
          .get('/teams/myteam/members')
          .reply(200, [adminTeamMember, collaboratorTeamMember])

        const {stdout} = await runCommand(['members', '--team', 'myteam'])

        expect(stdout).to.not.contain('Status')
      })

      it('filters members by pending invites', async () => {
        nock('https://api.heroku.com')
          .get('/teams/myteam')
          .reply(200, {type: 'team'})
          .get('/teams/myteam/features')
          .reply(200, [{name: 'team-invite-acceptance', enabled: true}])
          .get('/teams/myteam/invitations')
          .reply(200, [{
            user: {email: 'invited-user@mail.com'},
            role: 'admin',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          }])
          .get('/teams/myteam/members')
          .reply(200, [adminTeamMember, collaboratorTeamMember])

        const {stdout} = await runCommand(['members', '--team', 'myteam', '--pending'])

        expect(stdout).to.contain('invited-user@mail.com')
        expect(stdout).to.contain('admin')
        expect(stdout).to.contain('pending')
      })
    })
  })
})
