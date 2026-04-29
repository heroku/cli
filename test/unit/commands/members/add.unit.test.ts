import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import MembersAdd from '../../../../src/commands/members/add.js'

describe('heroku members:add', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('adds a member to an org', async function () {
    api
      .get('/teams/myteam')
      .reply(200, {type: 'enterprise'})
      .put('/teams/myteam/members')
      .reply(200, {})

    const {stderr} = await runCommand(MembersAdd, ['--team', 'myteam', '--role', 'admin', 'foo@foo.com'])

    expect(stderr).to.contain('Adding foo@foo.com to myteam as admin')
  })

  it('sends an invite when adding a new user to the team', async function () {
    api
      .get('/teams/myteam')
      .reply(200, {type: 'team'})
      .get('/teams/myteam/features')
      .reply(200, [{enabled: true, name: 'team-invite-acceptance'}])
      .put('/teams/myteam/invitations')
      .reply(200, {})

    const {stderr} = await runCommand(MembersAdd, ['--role', 'admin', '--team', 'myteam', 'foo@foo.com'])

    expect(stderr).to.contain('Inviting foo@foo.com to myteam as admin')
  })
})
