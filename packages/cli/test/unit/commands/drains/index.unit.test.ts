import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('drains', function () {
  let api: nock.Scope
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

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows log drains', async function () {
    api
      .get('/apps/myapp/log-drains')
      .reply(200, [DRAIN])

    const {stderr, stdout} = await runCommand(['drains', '-a', 'myapp'])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(`=== Drains

https://forker.herokuapp.com (d.8bf587e9-29d1-43c8-bd0e-36cdfaf35259)
`)
  })

  it('shows add-on drains', async function () {
    api
      .get('/apps/myapp/log-drains')
      .reply(200, [DRAIN_W_ADDON])
      .get('/apps/myapp/addons/add-on-123')
      .reply(200, {name: 'add-on-123', plan: {name: 'add-on:test'}})

    const {stderr, stdout} = await runCommand(['drains', '-a', 'myapp'])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(`=== Add-on Drains

add-on:test (add-on-123)
`)
  })

  it('shows drain_id for both', async function () {
    api
      .get('/apps/myapp/log-drains?extended=true')
      .reply(200, EXTENDED_DRAINS)
      .get('/apps/myapp/addons/add-on-123')
      .reply(200, {name: 'add-on-123', plan: {name: 'add-on:test'}})

    const {stderr, stdout} = await runCommand(['drains', '-a', 'myapp', '--extended'])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(`=== Drains

https://forker.herokuapp.com (d.8bf587e9-29d1-43c8-bd0e-36cdfaf35259) drain_id=67890
=== Add-on Drains

add-on:test (add-on-123) drain_id=12345
`)
  })

  it('shows correct json', async function () {
    api
      .get('/apps/myapp/log-drains?extended=true')
      .reply(200, EXTENDED_DRAINS)

    const {stderr, stdout} = await runCommand(['drains', '-a', 'myapp', '--extended', '--json'])

    expect(stderr).to.equal('')
    expect(JSON.parse(stdout)).to.deep.equal(EXTENDED_DRAINS)
  })
})
