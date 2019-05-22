/* tslint:disable:number-literal-format */
import {expect, test} from '@oclif/test'

describe('enterprises:usage:monthly', () => {
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

    test
      .stdout()
      .nock('https://api.heroku.com', (api: any) => api
        .get('/enterprise-accounts/wallyworld/usage')
        .reply(200, enterpriseAccountUsageResponse)
      )
      .command(['enterprises:usage:monthly', '--enterprise-account', 'wallyworld'])
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
      .command(['enterprises:usage:monthly', '--enterprise-account', 'wallyworld', '--start-date', '2018-09-01', '--end-date', '2018-10-01'])
      .it('lists the usage for an enterprise account using start and end dates', ctx => {
        expect(ctx.stdout).to.contain('Account      Team App        Date       Dyno  Connect Addon Partner Data ')
        expect(ctx.stdout).to.contain('my-test-team ops  exampleapp 2017-01-01 1.548 0       25000 1234    3489 ')
      })

    test
      .stderr()
      .nock('https://api.heroku.com', (api: any) => api
        .get('/enterprise-accounts/wallyworld/usage')
        .reply(200, [])
      )
      .command(['enterprises:usage:monthly', '--enterprise-account', 'wallyworld'])
      .it('warns when no usage data is available', ctx => {
        expect(ctx.stderr).to.contain('Warning: No usage data to list')
      })
  })

  context('when getting team usage', () => {
    const enterpriseTeamUsageResponse = [
      {
        addons: 1873385.0,
        connect: 0,
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
        connect: 0,
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
        .get('/teams/grumpy/usage/monthly')
        .reply(200, enterpriseTeamUsageResponse)
      )
      .command(['enterprises:usage:monthly', '--team', 'grumpy'])
      .it('lists the usage for an enterprise team', ctx => {
        expect(ctx.stdout).to.contain('App               Date       Dyno  Connect Addon Partner Data ')
        expect(ctx.stdout).to.contain('froyo-expcore     2017-01-01 1.548 0       19941 4457    15484 ')
        expect(ctx.stdout).to.contain('froyo-expcore-dev 2017-01-01 3.853 0       1075  12      1075 ')
        expect(ctx.stdout).to.contain('froyo-expcore     2017-02-01 0     0       19941 4457    15484 ')
        expect(ctx.stdout).to.contain('froyo-expcore-dev 2017-02-01 3.853 0       1075  0       1075 ')
      })

    test
      .stdout()
      .nock('https://api.heroku.com', (api: any) => api
        .get('/teams/grumpy/usage/monthly?start_date=2018-09-01&end_date=2018-10-01')
        .reply(200, enterpriseTeamUsageResponse)
      )
      .command(['enterprises:usage:monthly', '--start-date', '2018-09-01', '--end-date', '2018-10-01', '--team', 'grumpy'])
      .it('lists the usage for an enterprise team using start and end dates', ctx => {
        expect(ctx.stdout).to.contain('App               Date       Dyno  Connect Addon Partner Data ')
        expect(ctx.stdout).to.contain('froyo-expcore     2017-01-01 1.548 0       19941 4457    15484 ')
        expect(ctx.stdout).to.contain('froyo-expcore-dev 2017-01-01 3.853 0       1075  12      1075 ')
        expect(ctx.stdout).to.contain('froyo-expcore     2017-02-01 0     0       19941 4457    15484 ')
        expect(ctx.stdout).to.contain('froyo-expcore-dev 2017-02-01 3.853 0       1075  0       1075 ')
      })

    test
      .stderr()
      .nock('https://api.heroku.com', (api: any) => api
        .get('/teams/grumpy/usage/monthly')
        .reply(200, [])
      )
      .command(['enterprises:usage:monthly', '--team', 'grumpy'])
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
