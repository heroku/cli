import {expect, test} from '@oclif/test'

describe('config', function () {
  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'}),
    )
    .stdout()
    .command(['config', '--app=myapp'])
    .it('shows config vars', ({stdout}) => {
      expect(stdout).to.equal('=== myapp Config Vars\n\nLANG:     en_US.UTF-8\nRACK_ENV: production\n')
    })

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'}),
    )
    .stdout()
    .command(['config', '--app=myapp', '-j'])
    .it('--json', ({stdout}) => {
      expect(JSON.parse(stdout)).to.deep.equal({LANG: 'en_US.UTF-8', RACK_ENV: 'production'})
    })

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'}),
    )
    .stdout()
    .command(['config', '--app=myapp', '-s'])
    .it('--shell', ({stdout}) => {
      expect(stdout).to.equal(`LANG=en_US.UTF-8
RACK_ENV=production
`)
    })
})
