import {Config} from '@oclif/config'
import {expect, test} from '@oclif/test'

import {AccountMembers, Accounts, Permissions, Teams} from '../src/completions'

const config = new Config({root: __dirname})

describe('enterprise completions', () => {
  test
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts')
      .reply(200, [{name: 'heroku'}, {name: 'acme'}])
    )
    .it('returns enterprise accounts', async () => {
      let accounts = await Accounts.options({config})
      expect(accounts).to.be.eql(['acme', 'heroku'])
    })

  test
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/heroku/members')
      .reply(200, [{user: {email: 'codey@heroku.com'}}, {user: {email: 'appy@heroku.com'}}])
    )
    .it('returns enterprise account members', async () => {
      let accounts = await AccountMembers.options({config, flags: {'enterprise-account': 'heroku'}})
      expect(accounts).to.be.eql(['appy@heroku.com', 'codey@heroku.com'])
    })

  test
    .it('returns enterprise account permissions', async () => {
      let accounts = await Permissions.options({config})
      expect(accounts).to.be.eql(['billing', 'create', 'manage', 'view'])
    })

  test
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/heroku/teams')
      .reply(200, [{name: 'foo'}, {name: 'bar'}])
    )
    .it('returns enterprise teams', async () => {
      let accounts = await Teams.options({config, flags: {'enterprise-account': 'heroku'}})
      expect(accounts).to.be.eql(['bar', 'foo'])
    })
})
