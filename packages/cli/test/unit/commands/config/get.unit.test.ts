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

  it('--json with unset var', async function () {
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {EMPTY_VAR: '', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config:get', '--app=myapp', '--json', 'MISSING'])

    expect(JSON.parse(stdout)).to.deep.equal({key: 'MISSING', value: null})
  })

  it('--json with empty string var', async function () {
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {EMPTY_VAR: '', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config:get', '--app=myapp', '--json', 'EMPTY_VAR'])

    expect(JSON.parse(stdout)).to.deep.equal({key: 'EMPTY_VAR', value: ''})
  })

  it('--json with normal var', async function () {
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config:get', '--app=myapp', '--json', 'RACK_ENV'])

    expect(JSON.parse(stdout)).to.deep.equal({key: 'RACK_ENV', value: 'production'})
  })

  it('--json with multiple vars', async function () {
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {EMPTY_VAR: '', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config:get', '--app=myapp', '--json', 'MISSING', 'EMPTY_VAR', 'RACK_ENV'])

    expect(JSON.parse(stdout)).to.deep.equal([
      {key: 'MISSING', value: null},
      {key: 'EMPTY_VAR', value: ''},
      {key: 'RACK_ENV', value: 'production'},
    ])
  })
})
