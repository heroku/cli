/* tslint:disable:number-literal-format */
import {expect, test} from '@oclif/test'
const MockDate = require('mockdate')

describe('enterprises:usage:monthly', () => {
  const accountsResponse = {id: '01234567-89ab-cdef-0123-456789abcdef'}
  const accountsTeamsResponse = {id: '98765432-10ab-cdef-3210-456789fedcba'}

  test
    .command(['enterprises:usage:monthly', '--start-date', '2018-09-01', '--end-date', '2018-09-28'])
    .catch(err => expect(err.message).to.equal('You must specify usage for either --enterprise-account(-e) or --team(-t)'))
    .it('should give an error if neither an account or team is specified')

  context('when getting enterprise account usage', () => {
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
          data: 3489,
          dynos: 1.548,
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'ops',
          partner: 1234,
          space: 1.548
        }
      ],
      data: 3489,
      month: '2017-01',
      dynos: 1.548,
      id: '01234567-89ab-cdef-0123-456789abcdef',
      name: 'my-test-team',
      partner: 1234,
      space: 1.548
    }]

    test
      .stdout()
      .nock('https://api.heroku.com', (api: any) => api
        .get('/enterprise-accounts/wallyworld')
        .reply(200, accountsResponse)
        .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/usage/monthly?start=2019-02')
        .reply(200, enterpriseAccountUsageResponse)
      )
      .do(() => MockDate.set('2019-02-20'))
      .command(['enterprises:usage:monthly', '--enterprise-account', 'wallyworld'])
      .do(() => MockDate.reset())
      .it('lists the usage for an enterprise account', ctx => {
        expect(ctx.stdout).to.contain('Account      Team App        Month   Dyno  Connect Addon Partner Data Space')
        expect(ctx.stdout).to.contain('my-test-team ops  exampleapp 2017-01 1.548 0       25000 1234    3489')
        expect(ctx.stdout).to.contain('my-test-team ops             2017-01                                  1.548')
      })

    test
      .stdout()
      .nock('https://api.heroku.com', (api: any) => api
        .get('/enterprise-accounts/wallyworld')
        .reply(200, accountsResponse)
        .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/usage/monthly?start=2018-09&end=2018-10')
        .reply(200, enterpriseAccountUsageResponse)
      )
      .command(['enterprises:usage:monthly', '--enterprise-account', 'wallyworld', '--start-date', '2018-09', '--end-date', '2018-10'])
      .it('lists the usage for an enterprise account using start and end dates', ctx => {
        expect(ctx.stdout).to.contain('Account      Team App        Month   Dyno  Connect Addon Partner Data Space')
        expect(ctx.stdout).to.contain('my-test-team ops  exampleapp 2017-01 1.548 0       25000 1234    3489')
        expect(ctx.stdout).to.contain('my-test-team ops             2017-01                                  1.548 ')
      })

    test
      .stderr()
      .nock('https://api.heroku.com', (api: any) => api
        .get('/enterprise-accounts/wallyworld')
        .reply(200, accountsResponse)
        .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/usage/monthly?start=2019-02')
        .reply(200, [])
      )
      .do(() => MockDate.set('2019-02-20'))
      .command(['enterprises:usage:monthly', '--enterprise-account', 'wallyworld'])
      .do(() => MockDate.reset())
      .it('warns when no usage data is available', ctx => {
        expect(ctx.stderr).to.contain('Warning: No usage data to list')
      })
  })

  context('when getting team usage', () => {
    const enterpriseTeamUsageResponse = [
      {
        addons: 1873385.0,
        data: 442249,
        month: '2017-01',
        dynos: 1967.4409999999837,
        id: '5436a8dd-e3c4-495e-9974-ac6f451e6606',
        name: 'team-0001',
        partner: 1431136,
        space: 3.87095,
        apps: [
          {
            addons: 19941.0,
            app_name: 'froyo-expcore',
            connect: 0,
            data: 15484,
            dynos: 1.548,
            partner: 4457
          },
          {
            addons: 1075.0,
            app_name: 'froyo-expcore-dev',
            connect: 0,
            data: 1075,
            dynos: 3.853,
            partner: 12
          }
        ]
      },
      {
        addons: 1873385.0,
        data: 442249,
        month: '2017-02',
        dynos: 1967.4409999999837,
        id: '5436a8dd-e3c4-495e-9974-ac6f451e6606',
        name: 'team-0001',
        partner: 1431136,
        space: 3.87095,
        apps: [
          {
            addons: 19941.0,
            app_name: 'froyo-expcore',
            connect: 0,
            data: 15484,
            dynos: 0.0,
            partner: 4457
          },
          {
            addons: 1075.0,
            app_name: 'froyo-expcore-dev',
            connect: 0,
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
        .get('/teams/grumpy')
        .reply(200, accountsTeamsResponse)
        .get('/teams/98765432-10ab-cdef-3210-456789fedcba/usage/monthly/alpha?start=2019-02')
        .reply(200, enterpriseTeamUsageResponse)
      )
      .do(() => MockDate.set('2019-02-20'))
      .command(['enterprises:usage:monthly', '--team', 'grumpy'])
      .do(() => MockDate.reset())
      .it('lists the usage for an enterprise team', ctx => {
        expect(ctx.stdout).to.contain('Team      App               Month   Dyno  Connect Addon Partner Data  Space')
        expect(ctx.stdout).to.contain('team-0001 froyo-expcore     2017-01 1.548 0       19941 4457    15484')
        expect(ctx.stdout).to.contain('team-0001 froyo-expcore-dev 2017-01 3.853 0       1075  12      1075')
        expect(ctx.stdout).to.contain('team-0001                   2017-01                                   3.87095')
        expect(ctx.stdout).to.contain('team-0001 froyo-expcore     2017-02 0     0       19941 4457    15484')
        expect(ctx.stdout).to.contain('team-0001 froyo-expcore-dev 2017-02 3.853 0       1075  0       1075')
        expect(ctx.stdout).to.contain('team-0001                   2017-02                                   3.87095')
      })

    test
      .stdout()
      .nock('https://api.heroku.com', (api: any) => api
        .get('/teams/grumpy')
        .reply(200, accountsTeamsResponse)
        .get('/teams/98765432-10ab-cdef-3210-456789fedcba/usage/monthly/alpha?start=2018-09&end=2018-10')
        .reply(200, enterpriseTeamUsageResponse)
      )
      .command(['enterprises:usage:monthly', '--start-date', '2018-09', '--end-date', '2018-10', '--team', 'grumpy'])
      .it('lists the usage for an enterprise team using start and end dates', ctx => {
        expect(ctx.stdout).to.contain('Team      App               Month   Dyno  Connect Addon Partner Data  Space')
        expect(ctx.stdout).to.contain('team-0001 froyo-expcore     2017-01 1.548 0       19941 4457    15484')
        expect(ctx.stdout).to.contain('team-0001 froyo-expcore-dev 2017-01 3.853 0       1075  12      1075')
        expect(ctx.stdout).to.contain('team-0001                   2017-01                                   3.87095')
        expect(ctx.stdout).to.contain('team-0001 froyo-expcore     2017-02 0     0       19941 4457    15484')
        expect(ctx.stdout).to.contain('team-0001 froyo-expcore-dev 2017-02 3.853 0       1075  0       1075')
        expect(ctx.stdout).to.contain('team-0001                   2017-02                                   3.87095')
      })

    test
      .stderr()
      .nock('https://api.heroku.com', (api: any) => api
        .get('/teams/grumpy')
        .reply(200, accountsTeamsResponse)
        .get('/teams/98765432-10ab-cdef-3210-456789fedcba/usage/monthly/alpha?start=2019-02')
        .reply(200, [])
      )
      .do(() => MockDate.set('2019-02-20'))
      .command(['enterprises:usage:monthly', '--team', 'grumpy'])
      .do(() => MockDate.reset())
      .it('warns when no team usage data is available', ctx => {
        expect(ctx.stderr).to.contain('Warning: No usage data to list')
      })
  })

  test
    .stderr()
    .command(['enterprises:usage:monthly', '-e', 'suisse', '--team', 'lausanne'])
    .catch(err => expect(err.message).to.equal('--team= cannot also be provided when using --enterprise-account='))
    .it('should give an error when using exclusive flags')
})
