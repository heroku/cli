import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import MembersSet from '../../../../src/commands/members/set.js'

describe('heroku members:set', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  context('and group is a team', function () {
    it('does not warn the user when under the free org limit', async function () {
      api
        .patch('/teams/myteam/members')
        .reply(200)

      const {stderr} = await runCommand(MembersSet, ['--role', 'admin', '--team', 'myteam', 'foo@foo.com'])

      expect(stderr).to.contain('Adding foo@foo.com to myteam as admin')
    })

    it('does not warn the user when over the free org limit', async function () {
      api
        .patch('/teams/myteam/members')
        .reply(200)

      const {stderr} = await runCommand(MembersSet, ['--role', 'admin', '--team', 'myteam', 'foo@foo.com'])

      expect(stderr).to.contain('Adding foo@foo.com to myteam as admin')
    })
  })
  context('and group is an enterprise org', function () {
    it('adds a member to an org', async function () {
      api
        .patch('/teams/myteam/members')
        .reply(200)

      const {stderr} = await runCommand(MembersSet, ['--team', 'myteam', '--role', 'admin', 'foo@foo.com'])

      expect(stderr).to.contain('Adding foo@foo.com to myteam as admin')
    })
  })
})
