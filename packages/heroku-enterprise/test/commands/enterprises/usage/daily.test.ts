/* tslint:disable:number-literal-format */
import {expect, test} from '@oclif/test'

describe('enterprises:usage:daily', () => {
  const enterpriseAccountUsageResponse = 'account name,team name,app name,date,dyno units used,data add-on usage,third party add-on usage,third party add-on and data usage,spaces\n' +
    'wallyworld,stanley-team,aastanley,2019-01-01,0,0,0,0,\n' +
    'wallyworld,vinil-test,abuse-research,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,agile-fortress-36232,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,chicken,deniali,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,heres,fastboot-app,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,chicken,beach-85338,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,flow-production,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,chicken,intense-camping,2019-01-01,0.0322580633333333,0,0,0,'

  const enterpriseTeamUsageResponse = 'account name,team name,app name,date,dyno units used,data add-on usage,third party add-on usage,third party add-on and data usage,spaces\n' +
    'wallyworld,lausanne,agile-fortress-36232,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,flow-production,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,jesper-k8s-kpi-shim-prod,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,jesper-k8s-shim-gke,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,nepal-production,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,nepal-staging,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,new-test-app-transfer,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,sama-production,2019-01-01,0.0322580633333333,0,0,0,\n' +
    'wallyworld,lausanne,sama-staging,2019-01-01,0.0322580633333333,0,0,0,'

  const accountsResponse = {id: '01234567-89ab-cdef-0123-456789abcdef'}
  const accountsTeamsResponse = {id: '98765432-10ab-cdef-3210-456789fedcba'}

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/wallyworld')
      .reply(200, accountsResponse)
      .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/usage/daily?start=2019-09-01&end=2019-09-28')
      .reply(200, enterpriseAccountUsageResponse)
    )
    .command(['enterprises:usage:daily', '-e', 'wallyworld', '--start-date', '2019-09-01', '--end-date', '2019-09-28', '--csv'])
    .it('lists the usage for an enterprise account using start and end dates', ctx => {
      expect(ctx.stdout).to.contain('account name,team name,app name,date,dyno units used,data add-on usage,third party add-on usage,third party add-on and data usage,spaces\n')
      expect(ctx.stdout).to.contain('wallyworld,stanley-team,aastanley,2019-01-01,0,0,0,0')
      expect(ctx.stdout).to.contain('wallyworld,chicken,deniali,2019-01-01,0.0322580633333333,0,0,0,\n')
      expect(ctx.stdout).to.contain('wallyworld,chicken,intense-camping,2019-01-01,0.0322580633333333,0,0,0,')
    })

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/teams/grumpy')
      .reply(200, accountsTeamsResponse)
      .get('/teams/98765432-10ab-cdef-3210-456789fedcba/usage/daily?start=2019-09-01&end=2019-09-28')
      .reply(200, enterpriseTeamUsageResponse)
    )
    .command(['enterprises:usage:daily', '--team', 'grumpy', '--start-date', '2019-09-01', '--end-date', '2019-09-28', '--csv'])
    .it('lists the usage for an enterprise team', ctx => {
      expect(ctx.stdout).to.contain('account name,team name,app name,date,dyno units used,data add-on usage,third party add-on usage,third party add-on and data usage,spaces\n')
      expect(ctx.stdout).to.contain('wallyworld,lausanne,agile-fortress-36232,2019-01-01,0.0322580633333333,0,0,0,\n')
      expect(ctx.stdout).to.contain('wallyworld,lausanne,nepal-production,2019-01-01,0.0322580633333333,0,0,0,\n')
      expect(ctx.stdout).to.contain('wallyworld,lausanne,sama-staging,2019-01-01,0.0322580633333333,0,0,0,')
    })

  test
    .command(['enterprises:usage:daily', '--start-date', '2018-09-01', '--end-date', '2018-09-28', '--csv'])
    .catch(err => expect(err.message).to.equal('You must specify usage for either --enterprise-account(-e) or --team(-t)'))
    .it('should give an error if neither an account or team is specified')

  test
    .command(['enterprises:usage:daily', '--team', 'grumpy', '--start-date', '2018-09-01', '--end-date', '2018-09-28', '--csv'])
    .catch(err => expect(err.message).to.equal('Invalid --start-date. Usage data not available before 2019-01-01'))
    .it('should give an error when start date is less than 2019-01-01')
})
