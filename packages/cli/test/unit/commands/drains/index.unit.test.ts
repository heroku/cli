import {expect, test} from '@oclif/test'

describe('drains', function () {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/apps/myapp/log-drains')
        .reply(200, [{
          token: 'd.8bf587e9-29d1-43c8-bd0e-36cdfaf35259',
          url: 'https://forker.herokuapp.com'}])
    })
    .command(['drains', '-a', 'myapp'])
    .it('shows log drains', ({stdout, stderr}) => {
      expect(stderr).to.equal('')
      expect(stdout).to.equal(`=== Drains

https://forker.herokuapp.com (d.8bf587e9-29d1-43c8-bd0e-36cdfaf35259)
`)
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/apps/myapp/log-drains')
        .reply(200, [{
          addon: {name: 'add-on-123'},
          token: 'd.8bf587e9-29d1-43c8-bd0e-36cdfaf35259',
          url: 'https://forker.herokuapp.com'}])
        .get('/apps/myapp/addons/add-on-123')
        .reply(200, {name: 'add-on-123', plan: {name: 'add-on:test'}})
    })
    .command(['drains', '-a', 'myapp'])
    .it('shows add-on drains', ({stdout, stderr}) => {
      expect(stderr).to.equal('')
      expect(stdout).to.equal(`=== Add-on Drains

add-on:test (add-on-123)
`)
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/apps/myapp/log-drains?extended=true')
        .reply(200, [{
          addon: {name: 'add-on-123'},
          token: 'd.8bf587e9-29d1-43c8-bd0e-36cdfaf35259',
          url: 'https://forker.herokuapp.com',
          extended: {
            drain_id: 12345,
          },
        }, {
          token: 'd.8bf587e9-29d1-43c8-bd0e-36cdfaf35259',
          url: 'https://forker.herokuapp.com',
          extended: {
            drain_id: 67890,
          },
        }])
        .get('/apps/myapp/addons/add-on-123')
        .reply(200, {name: 'add-on-123', plan: {name: 'add-on:test'}})
    })
    .command(['drains', '-a', 'myapp', '--extended'])
    .it('shows drain_id for both', ({stdout, stderr}) => {
      expect(stderr).to.equal('')
      expect(stdout).to.equal(`=== Drains

https://forker.herokuapp.com (d.8bf587e9-29d1-43c8-bd0e-36cdfaf35259) drain_id=67890
=== Add-on Drains

add-on:test (add-on-123) drain_id=12345
`)
    })
})
