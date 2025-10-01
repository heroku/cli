import {expect, test} from '@oclif/test'

describe('heroku members:add', function () {
  test
    .stderr()
    .nock('https://api.heroku.com', api => {
      api.get('/teams/myteam')
        .reply(200, {type: 'enterprise'})
      api.put('/teams/myteam/members')
        .reply(200, {})
    })
    .command(['members:add', '--team', 'myteam', '--role', 'admin', 'foo@foo.com'])
    .it('adds a member to an org', ctx => {
      expect(ctx.stderr).to.contain('Adding foo@foo.com to myteam as admin')
    })

  test
    .stderr()
    .nock('https://api.heroku.com', api => {
      api.get('/teams/myteam')
        .reply(200, {type: 'team'})
      api.get('/teams/myteam/features')
        .reply(200, [{enabled: true, name: 'team-invite-acceptance'}])
      api.put('/teams/myteam/invitations')
        .reply(200, {})
    })
    .command(['members:add', '--role', 'admin', '--team', 'myteam', 'foo@foo.com'])
    .it('sends an invite when adding a new user to the team', ctx => {
      expect(ctx.stderr).to.contain('Inviting foo@foo.com to myteam as admin')
    })
})
