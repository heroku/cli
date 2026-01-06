import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('heroku members:set', function () {
  afterEach(() => nock.cleanAll())

  context('and group is a team', function () {
    it('does not warn the user when under the free org limit', async () => {
      nock('https://api.heroku.com')
        .patch('/teams/myteam/members')
        .reply(200)

      const {stderr} = await runCommand(['members:set', '--role', 'admin', '--team', 'myteam', 'foo@foo.com'])

      expect(stderr).to.contain('Adding foo@foo.com to myteam as admin')
    })

    it('does not warn the user when over the free org limit', async () => {
      nock('https://api.heroku.com')
        .patch('/teams/myteam/members')
        .reply(200)

      const {stderr} = await runCommand(['members:set', '--role', 'admin', '--team', 'myteam', 'foo@foo.com'])

      expect(stderr).to.contain('Adding foo@foo.com to myteam as admin')
    })
  })
  context('and group is an enterprise org', function () {
    it('adds a member to an org', async () => {
      nock('https://api.heroku.com')
        .patch('/teams/myteam/members')
        .reply(200)

      const {stderr} = await runCommand(['members:set', '--team', 'myteam', '--role', 'admin', 'foo@foo.com'])

      expect(stderr).to.contain('Adding foo@foo.com to myteam as admin')
    })
  })
})
