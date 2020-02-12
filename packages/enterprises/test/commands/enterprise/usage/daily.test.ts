/* tslint:disable:number-literal-format */
import {expect, test} from '@oclif/test'

describe('enterprise:usage:daily', () => {
  const accountsResponse = {id: '01234567-89ab-cdef-0123-456789abcdef'}
  const accountsTeamsResponse = {id: '98765432-10ab-cdef-3210-456789fedcba'}

  const accountCSVUsageResponse = 'account name,team name,app name,date,dyno units used,data add-on usage,third party add-on usage,third party add-on and data usage,spaces\n' +
    'wallyworld,stanley-team,aastanley,2019-01-01,0,0,0,0,\n' +
    'wallyworld,vinil-test,abuse-research,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,agile-fortress-36232,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,chicken,deniali,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,heres,fastboot-app,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,chicken,beach-85338,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,flow-production,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,chicken,intense-camping,2019-01-01,0.0322580633333333,0,0,0,'

  const teamCSVResponse = 'account name,team name,app name,date,dyno units used,data add-on usage,third party add-on usage,third party add-on and data usage,spaces\n' +
    'wallyworld,lausanne,agile-fortress-36232,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,flow-production,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,jesper-k8s-kpi-shim-prod,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,jesper-k8s-shim-gke,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,nepal-production,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,nepal-staging,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,new-test-app-transfer,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,sama-production,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,sama-staging,2019-01-01,0.0322580633333333,0,0,0,'

  const accountJSONUsageResponse = [{
    addons: 25000,
    teams: [
      {
        addons: 25000,
        apps: [
          {
            addons: 25000,
            app_name: 'exampleapp',
            data: 3489,
            dynos: 1.548,
            partner: 1234
          }
        ],
        data: 3489,
        dynos: 1.548,
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'ops',
        partner: 1234,
        space: 1.548
      }
    ],
    data: 3489,
    date: '2017-01-01',
    dynos: 1.548,
    id: '01234567-89ab-cdef-0123-456789abcdef',
    name: 'my-test-team',
    partner: 1234,
    space: 1.548
  }]

  const teamJSONUsageResponse = [
    {
      addons: 1873385.0,
      data: 442249,
      date: '2017-01-01',
      dynos: 1967.4409999999837,
      id: '5436a8dd-e3c4-495e-9974-ac6f451e6606',
      name: 'team-0001',
      partner: 1431136,
      space: 3.87095,
      apps: [
        {
          addons: 19941.0,
          app_name: 'froyo-expcore',
          data: 15484,
          dynos: 1.548,
          partner: 4457
        },
        {
          addons: 1075.0,
          app_name: 'froyo-expcore-dev',
          data: 1075,
          dynos: 3.853,
          partner: 12
        }
      ]
    },
    {
      addons: 1873385.0,
      data: 442249,
      date: '2017-02-01',
      dynos: 1967.4409999999837,
      id: '5436a8dd-e3c4-495e-9974-ac6f451e6606',
      name: 'team-0001',
      partner: 1431136,
      space: 3.87095,
      apps: [
        {
          addons: 19941.0,
          app_name: 'froyo-expcore',
          data: 15484,
          dynos: 0.0,
          partner: 4457
        },
        {
          addons: 1075.0,
          app_name: 'froyo-expcore-dev',
          data: 1075,
          dynos: 3.853,
          partner: 0
        }
      ]
    }
  ]

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/wallyworld')
      .reply(200, accountsResponse)
      .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/usage/daily?start=2019-09-01&end=2019-09-28')
      .matchHeader('Accept', 'text/csv; version=3')
      .reply(200, accountCSVUsageResponse)
    )
    .command(['enterprise:usage:daily', '-e', 'wallyworld', '--start-date', '2019-09-01', '--end-date', '2019-09-28', '--csv'])
    .it('lists the usage for an enterprise account using start and end dates', ctx => {
      expect(ctx.stdout).to.contain('account name,team name,app name,date,dyno units used,data add-on usage,third party add-on usage,third party add-on and data usage,spaces\n')
      expect(ctx.stdout).to.contain('wallyworld,stanley-team,aastanley,2019-01-01,0,0,0,0')
      expect(ctx.stdout).to.contain('wallyworld,chicken,deniali,2019-01-01,0.0322580633333333,0,0,0,\n')
      expect(ctx.stdout).to.contain('wallyworld,chicken,intense-camping,2019-01-01,0.0322580633333333,0,0,0,')
    })

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/teams/lausanne')
      .reply(200, accountsTeamsResponse)
      .get('/teams/98765432-10ab-cdef-3210-456789fedcba/usage/daily?start=2019-09-01&end=2019-09-28')
      .matchHeader('Accept', 'text/csv; version=3')
      .reply(200, teamCSVResponse)
    )
    .command(['enterprise:usage:daily', '--team', 'lausanne', '--start-date', '2019-09-01', '--end-date', '2019-09-28', '--csv'])
    .it('lists the usage for an enterprise team', ctx => {
      expect(ctx.stdout).to.contain('account name,team name,app name,date,dyno units used,data add-on usage,third party add-on usage,third party add-on and data usage,spaces\n')
      expect(ctx.stdout).to.contain('wallyworld,lausanne,agile-fortress-36232,2019-01-01,0.0322580633333333,0,0,0,\n')
      expect(ctx.stdout).to.contain('wallyworld,lausanne,nepal-production,2019-01-01,0.0322580633333333,0,0,0,\n')
      expect(ctx.stdout).to.contain('wallyworld,lausanne,sama-staging,2019-01-01,0.0322580633333333,0,0,0,')
    })

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/wallyworld')
      .reply(200, accountsResponse)
      .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/usage/daily?start=2018-09-01&end=2018-10-01')
      .matchHeader('Accept', 'application/vnd.heroku+json; version=3')
      .reply(200, accountJSONUsageResponse)
    )
    .command(['enterprise:usage:daily', '--enterprise-account', 'wallyworld', '--start-date', '2018-09-01', '--end-date', '2018-10-01'])
    .it('lists the usage for an enterprise account', ctx => {
      expect(ctx.stdout).to.contain('Account      Team App        Date       Dyno  Addon Partner Data Space')
      expect(ctx.stdout).to.contain('my-test-team ops  exampleapp 2017-01-01 1.548 25000 1234    3489')
      expect(ctx.stdout).to.contain('my-test-team ops             2017-01-01                          1.548')
    })

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/wallyworld')
      .reply(200, accountsResponse)
      .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/usage/daily?start=2018-09-01&end=2018-10-01')
      .matchHeader('Accept', 'application/vnd.heroku+json; version=3')
      .reply(200, [])
    )
    .command(['enterprise:usage:daily', '--enterprise-account', 'wallyworld', '--start-date', '2018-09-01', '--end-date', '2018-10-01'])
    .it('warns when no enterprise usage data is available', ctx => {
      expect(ctx.stderr).to.contain('Warning: No usage data to list')
    })

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/teams/lausanne')
      .reply(200, accountsTeamsResponse)
      .get('/teams/98765432-10ab-cdef-3210-456789fedcba/usage/daily?start=2018-09-01&end=2018-10-01')
      .matchHeader('Accept', 'application/vnd.heroku+json; version=3')
      .reply(200, teamJSONUsageResponse)
    )
    .command(['enterprise:usage:daily', '--start-date', '2018-09-01', '--end-date', '2018-10-01', '--team', 'lausanne'])
    .it('lists the usage for an enterprise team using start and end dates', ctx => {
      expect(ctx.stdout).to.contain('Team      App               Date       Dyno  Addon Partner Data  Space ')
      expect(ctx.stdout).to.contain('team-0001 froyo-expcore     2017-01-01 1.548 19941 4457    15484')
      expect(ctx.stdout).to.contain('team-0001 froyo-expcore-dev 2017-01-01 3.853 1075  12      1075 ')
      expect(ctx.stdout).to.contain('team-0001                   2017-01-01                           3.87095')
      expect(ctx.stdout).to.contain('team-0001 froyo-expcore     2017-02-01 0     19941 4457    15484')
      expect(ctx.stdout).to.contain('team-0001 froyo-expcore-dev 2017-02-01 3.853 1075  0       1075 ')
      expect(ctx.stdout).to.contain('team-0001                   2017-02-01                           3.87095')
    })

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/teams/lausanne')
      .reply(200, accountsTeamsResponse)
      .get('/teams/98765432-10ab-cdef-3210-456789fedcba/usage/daily?start=2018-09-01&end=2018-10-01')
      .matchHeader('Accept', 'application/vnd.heroku+json; version=3')
      .reply(200, [])
    )
    .command(['enterprise:usage:daily', '--start-date', '2018-09-01', '--end-date', '2018-10-01', '--team', 'lausanne'])
    .it('warns when no team usage data is available', ctx => {
      expect(ctx.stderr).to.contain('Warning: No usage data to list')
    })

  test
    .command(['enterprise:usage:daily', '--start-date', '2018-09-01', '--end-date', '2018-09-28', '--csv'])
    .catch(err => expect(err.message).to.equal('You must specify usage for either --enterprise-account(-e) or --team(-t)'))
    .it('should give an error if neither an account or team is specified')

  test
    .stderr()
    .command(['enterprise:usage:daily', '-e', 'suisse', '--team', 'lausanne'])
    .catch(err => expect(err.message).to.equal('--team= cannot also be provided when using --enterprise-account='))
    .it('should give an error when using exclusive flags')
})
