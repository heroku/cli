import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('heroku members:add', function () {
  afterEach(() => nock.cleanAll())

  it('adds a member to an org', async () => {
    nock('https://api.heroku.com')
      .get('/teams/myteam')
      .reply(200, {type: 'enterprise'})
      .put('/teams/myteam/members')
      .reply(200, {})

    const {stderr} = await runCommand(['members:add', '--team', 'myteam', '--role', 'admin', 'foo@foo.com'])

    expect(stderr).to.contain('Adding foo@foo.com to myteam as admin')
  })

  it('sends an invite when adding a new user to the team', async () => {
    nock('https://api.heroku.com')
      .get('/teams/myteam')
      .reply(200, {type: 'team'})
      .get('/teams/myteam/features')
      .reply(200, [{enabled: true, name: 'team-invite-acceptance'}])
      .put('/teams/myteam/invitations')
      .reply(200, {})

    const {stderr} = await runCommand(['members:add', '--role', 'admin', '--team', 'myteam', 'foo@foo.com'])

    expect(stderr).to.contain('Inviting foo@foo.com to myteam as admin')
  })
})
