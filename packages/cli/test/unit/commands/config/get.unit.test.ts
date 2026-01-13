import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('config', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows config vars', async function () {
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config:get', '--app=myapp', 'RACK_ENV'])

    expect(stdout).to.equal('production\n')
  })

  it('--shell', async function () {
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config:get', '--app=myapp', '-s', 'RACK_ENV'])

    expect(stdout).to.equal('RACK_ENV=production\n')
  })

  it('missing', async function () {
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config:get', '--app=myapp', 'MISSING'])

    expect(stdout).to.equal('\n')
  })
})
