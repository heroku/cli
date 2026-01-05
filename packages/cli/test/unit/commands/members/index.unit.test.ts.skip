import {expect, test} from '@oclif/test'

describe('heroku members', function () {
  const adminTeamMember = {email: 'admin@heroku.com', role: 'admin', user: {email: 'admin@heroku.com'}}
  const collaboratorTeamMember = {email: 'collab@heroku.com', role: 'collaborator', user: {email: 'collab@heroku.com'}}
  const memberTeamMember = {email: 'member@heroku.com', role: 'member', user: {email: 'member@heroku.com'}}

  context('when it is an Enterprise team', function () {
    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get('/teams/myteam')
          .reply(200, {type: 'enterprise'})
        api.get('/teams/myteam/members')
          .reply(200, [])
      })
      .command(['members', '--team', 'myteam'])
      .it('shows there are not team members if it is an orphan team', ctx => {
        expect(ctx.stdout).to.contain('No members in myteam')
      })

    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get('/teams/myteam')
          .reply(200, {type: 'enterprise'})
        api.get('/teams/myteam/members')
          .reply(200, [adminTeamMember, collaboratorTeamMember])
      })
      .command(['members', '--team', 'myteam'])
      .it('shows all the team members', ctx => {
        expect(ctx.stdout).to.contain('admin@heroku.com')
        expect(ctx.stdout).to.contain('admin')
        expect(ctx.stdout).to.contain('collab@heroku.com')
        expect(ctx.stdout).to.contain('collaborator')
      })

    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get('/teams/myteam')
          .reply(200, {type: 'enterprise'})
        api.get('/teams/myteam/members')
          .reply(200, [adminTeamMember, memberTeamMember])
      })
      .command(['members', '--team', 'myteam', '--role', 'member'])
      .it('filters members by role', ctx => {
        expect(ctx.stdout).to.contain('member@heroku.com')
        expect(ctx.stdout).to.contain('member')
      })

    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get('/teams/myteam')
          .reply(200, {type: 'enterprise'})
        api.get('/teams/myteam/members')
          .reply(200, [adminTeamMember, memberTeamMember])
      })
      .command(['members', '--team', 'myteam', '--role', 'collaborator'])
      .it("shows the right message when filter doesn't return results", ctx => {
        expect(ctx.stdout).to.contain('No members in myteam with role collaborator')
      })
  })

  context('when it is a team', function () {
    context('without the feature flag team-invite-acceptance', function () {
      test
        .stdout()
        .nock('https://api.heroku.com', api => {
          api.get('/teams/myteam')
            .reply(200, {type: 'team'})
          api.get('/teams/myteam/features')
            .reply(200, [])
          api.get('/teams/myteam/members')
            .reply(200, [adminTeamMember, collaboratorTeamMember])
        })
        .command(['members', '--team', 'myteam'])
        .it('does not show the Status column when there are no pending invites', ctx => {
          expect(ctx.stdout).to.not.contain('Status')
        })
    })

    context('with the feature flag team-invite-acceptance', function () {
      test
        .stdout()
        .nock('https://api.heroku.com', api => {
          api.get('/teams/myteam')
            .reply(200, {type: 'team'})
          api.get('/teams/myteam/features')
            .reply(200, [{name: 'team-invite-acceptance', enabled: true}])
          api.get('/teams/myteam/invitations')
            .reply(200, [{
              user: {email: 'invited-user@mail.com'},
              role: 'admin',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
            }])
          api.get('/teams/myteam/members')
            .reply(200, [adminTeamMember, collaboratorTeamMember])
        })
        .command(['members', '--team', 'myteam'])
        .it('shows all members including those with pending invites', ctx => {
          expect(ctx.stdout).to.contain('admin@heroku.com')
          expect(ctx.stdout).to.contain('admin')
          expect(ctx.stdout).to.contain('collab@heroku.com')
          expect(ctx.stdout).to.contain('collaborator')
          expect(ctx.stdout).to.contain('invited-user@mail.com')
          expect(ctx.stdout).to.contain('pending')
        })

      test
        .stdout()
        .nock('https://api.heroku.com', api => {
          api.get('/teams/myteam')
            .reply(200, {type: 'team'})
          api.get('/teams/myteam/features')
            .reply(200, [{name: 'team-invite-acceptance', enabled: true}])
          api.get('/teams/myteam/invitations')
            .reply(200, [])
          api.get('/teams/myteam/members')
            .reply(200, [adminTeamMember, collaboratorTeamMember])
        })
        .command(['members', '--team', 'myteam'])
        .it('does not show the Status column when there are no pending invites', ctx => {
          expect(ctx.stdout).to.not.contain('Status')
        })

      test
        .stdout()
        .nock('https://api.heroku.com', api => {
          api.get('/teams/myteam')
            .reply(200, {type: 'team'})
          api.get('/teams/myteam/features')
            .reply(200, [{name: 'team-invite-acceptance', enabled: true}])
          api.get('/teams/myteam/invitations')
            .reply(200, [{
              user: {email: 'invited-user@mail.com'},
              role: 'admin',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
            }])
          api.get('/teams/myteam/members')
            .reply(200, [adminTeamMember, collaboratorTeamMember])
        })
        .command(['members', '--team', 'myteam', '--pending'])
        .it('filters members by pending invites', ctx => {
          expect(ctx.stdout).to.contain('invited-user@mail.com')
          expect(ctx.stdout).to.contain('admin')
          expect(ctx.stdout).to.contain('pending')
        })
    })
  })
})
