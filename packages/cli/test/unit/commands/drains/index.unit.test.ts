import {expect, test} from '@oclif/test'

const DRAIN = {
  token: 'd.8bf587e9-29d1-43c8-bd0e-36cdfaf35259',
  url: 'https://forker.herokuapp.com',
}

const DRAIN_W_ADDON = {...DRAIN, addon: {name: 'add-on-123'}}

const EXTENDED_DRAINS = [
  {
    ...DRAIN_W_ADDON,
    extended: {
      drain_id: 12345,
    },
  }, {
    ...DRAIN,
    extended: {
      drain_id: 67890,
    },
  },
]

describe('drains', function () {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/apps/myapp/log-drains')
        .reply(200, [DRAIN])
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
        .reply(200, [DRAIN_W_ADDON])
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
        .reply(200, EXTENDED_DRAINS)
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

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/apps/myapp/log-drains?extended=true')
        .reply(200, EXTENDED_DRAINS)
    })
    .command(['drains', '-a', 'myapp', '--extended', '--json'])
    .it('shows correct json', ({stdout, stderr}) => {
      expect(stderr).to.equal('')
      expect(JSON.parse(stdout)).to.deep.equal(EXTENDED_DRAINS)
    })
})
