import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import stripAnsi from 'strip-ansi'

describe('config:set', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('sets a config var', async function () {
    api
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(200, {RACK_ENV: 'production', RAILS_ENV: 'production'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    const {stderr, stdout} = await runCommand(['config:set', 'RACK_ENV=production', '--app', 'myapp'])

    expect(stdout).to.equal('RACK_ENV: production\n')
    expect(stderr).to.include('Setting RACK_ENV and restarting ⬢ myapp')
    expect(stderr).to.include('done, v10')
  })

  it('sets a config var with an "=" in it', async function () {
    api
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production=foo'})
      .reply(200)
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    const {stderr, stdout} = await runCommand(['config:set', 'RACK_ENV=production=foo', '--app', 'myapp'])

    expect(stdout).to.equal('\n')
    expect(stderr).to.include('Setting RACK_ENV and restarting ⬢ myapp')
    expect(stderr).to.include('done, v10')
  })

  it('errors without args', async function () {
    const {error} = await runCommand(['config:set', '--app', 'myapp'])

    expect(error?.message).to.equal('Usage: heroku config:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.')
    expect(error?.oclif?.exit).to.equal(1)
  })

  it('errors with invalid args', async function () {
    const {error} = await runCommand(['config:set', '--app', 'myapp', 'WRONG'])

    expect(stripAnsi(error?.message || '')).to.equal('WRONG is invalid. Must be in the format FOO=bar.')
    expect(error?.oclif?.exit).to.equal(1)
  })
})
