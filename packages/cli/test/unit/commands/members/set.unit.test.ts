import {expect, test} from '@oclif/test'

describe('heroku members:set', function () {
  context('and group is a team', function () {
    test
      .stderr()
      .nock('https://api.heroku.com', api => {
        api.patch('/teams/myteam/members')
          .reply(200)
      })
      .command(['members:set', '--role', 'admin', '--team', 'myteam', 'foo@foo.com'])
      .it('does not warn the user when under the free org limit', ctx => {
        expect(ctx.stderr).to.contain('Adding foo@foo.com to myteam as admin')
      })

    test
      .stderr()
      .nock('https://api.heroku.com', api => {
        api.patch('/teams/myteam/members')
          .reply(200)
      })
      .command(['members:set', '--role', 'admin', '--team', 'myteam', 'foo@foo.com'])
      .it('does not warn the user when over the free org limit', ctx => {
        expect(ctx.stderr).to.contain('Adding foo@foo.com to myteam as admin')
      })
  })
  context('and group is an enterprise org', function () {
    test
      .stderr()
      .nock('https://api.heroku.com', api => {
        api.patch('/teams/myteam/members')
          .reply(200)
      })
      .command(['members:set', '--team', 'myteam', '--role', 'admin', 'foo@foo.com'])
      .it('adds a member to an org', ctx => {
        expect(ctx.stderr).to.contain('Adding foo@foo.com to myteam as admin')
      })
  })
})
