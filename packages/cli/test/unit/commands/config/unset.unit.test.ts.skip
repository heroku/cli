import {test} from '@oclif/test'

describe('config', function () {
  test
    .nock('https://api.heroku.com', api => api
      .patch('/apps/myapp/config-vars', {
        FOO: null,
        RACK_ENV: null,
      })
      .reply(200, {})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 1}]),
    )
    .stdout()
    .command(['config:unset', '-amyapp', 'FOO', 'RACK_ENV'])
    .it('removes 2 config vars')
})
