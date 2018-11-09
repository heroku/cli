import {expect, test} from '@oclif/test'

describe('enterprises:teams', () => {
  const getTeamsResponse = [
    {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      created_at: '2012-01-01T12:00:00Z',
      credit_card_collections: true,
      default: true,
      enterprise_account: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'ch'
      },
      identity_provider: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        slug: 'ch-sso'
      },
      membership_limit: 25,
      name: 'Luzern',
      provisioned_licenses: true,
      role: 'admin',
      type: 'team',
      updated_at: '2012-01-01T12:00:00Z'
    },
    {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      created_at: '2013-01-01T12:00:00Z',
      credit_card_collections: true,
      default: true,
      enterprise_account: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'ch'
      },
      identity_provider: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        slug: 'ch-sso'
      },
      membership_limit: 25,
      name: 'Lausanne',
      provisioned_licenses: true,
      role: null,
      type: 'team',
      updated_at: '2013-01-01T12:00:00Z'
    },
  ]

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/ch/teams')
      .reply(200, getTeamsResponse)
    )
    .command(['enterprises:teams', '--enterprise-account', 'ch'])
    .it('lists all the teams of the enterprise account', ctx => {
      expect(ctx.stdout).to.contain(`Team Name My Roles${''.padEnd(1)}
Luzern    admin${''.padEnd(4)}
Lausanne${''.padEnd(11)}\n`)
    })

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/ch/teams')
      .reply(200, getTeamsResponse)
    )
    .command(['enterprises:teams', '--enterprise-account', 'ch', '--filter=my roles=.'])
    .it('lists all the teams you are a member of for the enterprise account', ctx => {
      expect(ctx.stdout).to.contain(`Team Name My Roles${''.padEnd(1)}
Luzern    admin${''.padEnd(4)}\n`)
    })

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/ch/teams')
      .reply(200, [])
    )
    .command(['enterprises:teams', '--enterprise-account', 'ch', '--filter=my roles=.'])
    .it('warns there are no enterprise teams to list', ctx => {
      expect(ctx.stderr).to.contain('No enterprise teams to list')
    })
})
