import {test, expect} from '@oclif/test'

describe('config:set', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api
        .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
        .reply(200, {RACK_ENV: 'production', RAILS_ENV: 'production'})
        .get('/apps/myapp/releases')
        .reply(200, [{version: 10}])
    })
    .command(['config:set', 'RACK_ENV=production', '--app', 'myapp'])
    .it('sets a config var', ({stdout, stderr}) => {
      expect(stdout).to.equal('RACK_ENV: production\n')
      expect(stderr).to.include('Setting RACK_ENV and restarting ⬢ myapp.')
      expect(stderr).to.include('done, v10')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api
        .patch('/apps/myapp/config-vars', {RACK_ENV: 'production=foo'})
        .reply(200)
        .get('/apps/myapp/releases')
        .reply(200, [{version: 10}])
    })
    .command(['config:set', 'RACK_ENV=production=foo', '--app', 'myapp'])
    .it('sets a config var with an "=" in it', ({stdout, stderr}) => {
      expect(stdout).to.equal('\n')
      expect(stderr).to.include('Setting RACK_ENV and restarting ⬢ myapp.')
      expect(stderr).to.include('done, v10')
    })

  test
    .stdout()
    .stderr()
    .command(['config:set', '--app', 'myapp'])
    .catch((error: any) => {
      expect(error.message).to.equal('Usage: heroku config:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.')
      expect(error.oclif.exit).to.equal(1)
    })
    .it('errors out on empty')
})
