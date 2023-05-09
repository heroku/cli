import {expect, test} from '@oclif/test'

describe('config', () => {
  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'}),
    )
    .stdout()
    .command(['config:get', '--app=myapp', 'RACK_ENV'])
    .it('shows config vars', ({stdout}) => {
      expect(stdout).to.equal('production\n')
    })

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'}),
    )
    .stdout()
    .command(['config:get', '--app=myapp', '-s', 'RACK_ENV'])
    .it('--shell', ({stdout}) => {
      expect(stdout).to.equal('RACK_ENV=production\n')
    })

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'}),
    )
    .stdout()
    .command(['config:get', '--app=myapp', 'MISSING'])
    .it('missing', ({stdout}) => {
      expect(stdout).to.equal('\n')
    })
})
