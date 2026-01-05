import {expect, test} from '@oclif/test'

describe('heroku members:remove', function () {
  context('from an org', function () {
    test
      .stderr()
      .nock('https://api.heroku.com', api => {
        api.get('/teams/myteam')
          .reply(200, {name: 'myteam', role: 'admin', type: 'enterprise'})
        api.delete('/teams/myteam/members/foo%40foo.com')
          .reply(200)
      })
      .command(['members:remove', '--team', 'myteam', 'foo@foo.com'])
      .it('removes a member from an org', ctx => {
        expect(ctx.stderr).to.contain('Removing foo@foo.com from myteam')
      })
  })
  context('from a team', function () {
    context('without the feature flag team-invite-acceptance', function () {
      test
        .stderr()
        .nock('https://api.heroku.com', api => {
          api.get('/teams/myteam')
            .reply(200, {name: 'myteam', role: 'admin', type: 'team'})
          api.get('/teams/myteam/features')
            .reply(200, [])
          api.delete('/teams/myteam/members/foo%40foo.com')
            .reply(200)
        })
        .command(['members:remove', '--team', 'myteam', 'foo@foo.com'])
        .it('removes a member from an org', ctx => {
          expect(ctx.stderr).to.contain('Removing foo@foo.com from myteam')
        })
    })

    context('with the feature flag team-invite-acceptance', function () {
      context('with no pending invites', function () {
        test
          .stderr()
          .nock('https://api.heroku.com', api => {
            api.get('/teams/myteam')
              .reply(200, {name: 'myteam', role: 'admin', type: 'team'})
            api.get('/teams/myteam/features')
              .reply(200, [{enabled: true, name: 'team-invite-acceptance'}])
            api.get('/teams/myteam/invitations')
              .reply(200, [])
            api.delete('/teams/myteam/members/foo%40foo.com')
              .reply(200)
          })
          .command(['members:remove', '--team', 'myteam', 'foo@foo.com'])
          .it('removes a member', ctx => {
            expect(ctx.stderr).to.contain('Removing foo@foo.com from myteam')
          })
      })

      context('with pending invites', function () {
        test
          .stderr()
          .nock('https://api.heroku.com', api => {
            api.get('/teams/myteam')
              .reply(200, {name: 'myteam', role: 'admin', type: 'team'})
            api.get('/teams/myteam/features')
              .reply(200, [{enabled: true, name: 'team-invite-acceptance'}])
            api.get('/teams/myteam/invitations')
              .reply(200, [{
                invited_by: {email: 'invite@foo.com'},
                role: 'member',
                user: {email: 'foo@foo.com'},
              }])
            api.delete('/teams/myteam/invitations/foo@foo.com')
              .reply(200, {})
          })
          .command(['members:remove', '--team', 'myteam', 'foo@foo.com'])
          .it('revokes the invite', ctx => {
            expect(ctx.stderr).to.contain('Revoking invite for foo@foo.com in myteam')
          })
      })
    })
  })
})
