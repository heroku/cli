import {expect, test} from '@oclif/test'

describe('enterprises:audits', () => {
  const accountsResponse = {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    created_at: '2012-01-01T12:00:00Z',
    name: 'dingo',
    updated_at: '2012-01-01T12:00:00Z',
    identity_provider: {}
  }
  const auditsResponse = [
    {
      year: 2018,
      month: '06',
      created_at: '2018-07-01T00:02:19.603Z',
      checksum: '993dfc6f38c05311808ee919fe90bc191b8f9a5fa96562d8b0e942d82080c874',
      size: 4277
    },
    {
      year: 2018,
      month: '05',
      created_at: '2018-06-01T00:02:24.870Z',
      checksum: 'd1ef422b912595ccdb557b80b21e213c6744de32cb9308e4f4804fa53a39918c',
      size: 6743
    },
  ]

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/dingo')
      .reply(200, accountsResponse)
      .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/archives')
      .reply(200, auditsResponse)
    )
    .command(['enterprises:audits', '--enterprise-account', 'dingo'])
    .it('lists audit logs for a enterprise account', ctx => {
      expect(ctx.stdout.trim()).to.eq(`Audit Log${''.padEnd(1)}
2018-06${''.padEnd(3)}
2018-05`)
    })
  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/dingo')
      .reply(200, accountsResponse)
      .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/archives')
      .reply(200, auditsResponse)
    )
    .command(['enterprises:audits', '--enterprise-account', 'dingo', '--json'])
    .it('lists audit logs for a enterprise account in json format', ctx => {
      expect(ctx.stdout.trim()).to.eq(JSON.stringify(auditsResponse))
    })
  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/dingo')
      .reply(200, accountsResponse)
      .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/archives')
      .reply(200, [])
    )
    .command(['enterprises:audits', '--enterprise-account', 'dingo'])
    .it('warns when there are no audit logs to list', ctx => {
      expect(ctx.stderr).to.contain('No enterprise audit logs to list')
    })
  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/dingo')
      .reply(200, accountsResponse)
      .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/archives')
      .reply(200, auditsResponse)
    )
    .command(['enterprises:audits', '--enterprise-account', 'dingo', '-x'])
    .it('displays extended columns', ctx => {
      expect(ctx.stdout.trim()).to.eq(`Audit Log${''.padEnd(1)}Checksum${''.padEnd(57)}Size${''.padEnd(1)}
2018-06${''.padEnd(3)}993dfc6f38c05311808ee919fe90bc191b8f9a5fa96562d8b0e942d82080c874${''.padEnd(1)}4277${''.padEnd(1)}
2018-05${''.padEnd(3)}d1ef422b912595ccdb557b80b21e213c6744de32cb9308e4f4804fa53a39918c${''.padEnd(1)}6743`)
    })
})
