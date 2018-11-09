import {expect, test} from '@oclif/test'

describe('enterprises:usage', () => {
  const enterpriseAccountUsageResponse = [{
    addons: 25000,
    teams: [
      {
        addons: 25000,
        apps: [
          {
            addons: 25000,
            app_name: 'exampleapp',
            connect: 0,
            data: 3489,
            dynos: 1.548,
            partner: 1234
          }
        ],
        connect: 0,
        data: 3489,
        dynos: 1.548,
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'ops',
        partner: 1234,
        space: 1.548
      }
    ],
    connect: 0,
    data: 3489,
    date: '2017-01-01',
    dynos: 1.548,
    id: '01234567-89ab-cdef-0123-456789abcdef',
    name: 'my-test-team',
    partner: 1234,
    space: 1.548
  }]

  const enterpriseTeamUsageResponse = [
    {
      addons: 25000,
      apps: [
        {
          addons: 25000,
          app_name: 'moneyapp',
          connect: 0,
          data: 3489,
          dynos: 1.548,
          partner: 1234
        }
      ],
      connect: 0,
      data: 3489,
      date: '2017-01-01',
      dynos: 1.548,
      id: '01234567-89ab-cdef-0123-456789abcdef',
      name: 'grumpy',
      partner: 1234,
      space: 1.548
    }
  ]

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/wallyworld/usage')
      .reply(200, enterpriseAccountUsageResponse)
    )
    .command(['enterprises:usage', '--enterprise-account', 'wallyworld'])
    .it('lists the usage for an enterprise account', ctx => {
      expect(ctx.stdout).to.contain('Account      Team App        Date       Dyno  Connect Addon Partner Data ')
      expect(ctx.stdout).to.contain('my-test-team ops  exampleapp 2017-01-01 1.548 0       25000 1234    3489 ')
    })

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/wallyworld/usage?start_date=2018-09-01&end_date=2018-10-01')
      .reply(200, enterpriseAccountUsageResponse)
    )
    .command(['enterprises:usage', '--enterprise-account', 'wallyworld', '--start-date', '2018-09-01', '--end-date', '2018-10-01'])
    .it('lists the usage for an enterprise account using start and end dates', ctx => {
      expect(ctx.stdout).to.contain('Account      Team App        Date       Dyno  Connect Addon Partner Data ')
      expect(ctx.stdout).to.contain('my-test-team ops  exampleapp 2017-01-01 1.548 0       25000 1234    3489 ')
    })

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/wallyworld/teams/grumpy/usage')
      .reply(200, enterpriseTeamUsageResponse)
    )
    .command(['enterprises:usage', '--enterprise-account', 'wallyworld', '--team', 'grumpy'])
    .it('lists the usage for an enterprise team', ctx => {
      expect(ctx.stdout).to.contain('App      Date       Dyno  Connect Addon Partner Data ')
      expect(ctx.stdout).to.contain('moneyapp 2017-01-01 1.548 0       25000 1234    3489 ')
    })

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/wallyworld/teams/grumpy/usage?start_date=2018-09-01&end_date=2018-10-01')
      .reply(200, enterpriseTeamUsageResponse)
    )
    .command(['enterprises:usage', '--enterprise-account', 'wallyworld', '--start-date', '2018-09-01', '--end-date', '2018-10-01', '--team', 'grumpy'])
    .it('lists the usage for an enterprise team using start and end dates', ctx => {
      expect(ctx.stdout).to.contain('App      Date       Dyno  Connect Addon Partner Data ')
      expect(ctx.stdout).to.contain('moneyapp 2017-01-01 1.548 0       25000 1234    3489 ')
    })
})
