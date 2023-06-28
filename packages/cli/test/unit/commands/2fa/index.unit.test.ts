import {expect, test} from '@oclif/test'

describe('2fa', () => {
  test
    .nock('https://api.heroku.com', api => api
      .get('/account')
      .reply(200, {two_factor_authentication: true}),
    )
    .stdout()
    .command(['2fa'])
    .it('shows 2fa is enabled', ({stdout}) => {
      expect(stdout).to.equal('Two-factor authentication is enabled\n')
    })

  test
    .nock('https://api.heroku.com', api => api
      .get('/account')
      .reply(200, {two_factor_authentication: false}),
    )
    .stdout()
    .command(['2fa'])
    .it('shows 2fa is not enabled', ({stdout}) => {
      expect(stdout).to.equal('Two-factor authentication is not enabled\n')
    })
})
