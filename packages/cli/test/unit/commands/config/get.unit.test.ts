import {expect, test} from '@oclif/test'

describe('config', function () {
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

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/config-vars')
      .reply(200, {EMPTY_VAR: '', RACK_ENV: 'production'}),
    )
    .stdout()
    .command(['config:get', '--app=myapp', '--json', 'MISSING'])
    .it('--json with unset var', ({stdout}) => {
      expect(JSON.parse(stdout)).to.deep.equal({key: 'MISSING', value: null})
    })

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/config-vars')
      .reply(200, {EMPTY_VAR: '', RACK_ENV: 'production'}),
    )
    .stdout()
    .command(['config:get', '--app=myapp', '--json', 'EMPTY_VAR'])
    .it('--json with empty string var', ({stdout}) => {
      expect(JSON.parse(stdout)).to.deep.equal({key: 'EMPTY_VAR', value: ''})
    })

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'}),
    )
    .stdout()
    .command(['config:get', '--app=myapp', '--json', 'RACK_ENV'])
    .it('--json with normal var', ({stdout}) => {
      expect(JSON.parse(stdout)).to.deep.equal({key: 'RACK_ENV', value: 'production'})
    })

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/config-vars')
      .reply(200, {EMPTY_VAR: '', RACK_ENV: 'production'}),
    )
    .stdout()
    .command(['config:get', '--app=myapp', '--json', 'MISSING', 'EMPTY_VAR', 'RACK_ENV'])
    .it('--json with multiple vars', ({stdout}) => {
      expect(JSON.parse(stdout)).to.deep.equal([
        {key: 'MISSING', value: null},
        {key: 'EMPTY_VAR', value: ''},
        {key: 'RACK_ENV', value: 'production'},
      ])
    })
})
