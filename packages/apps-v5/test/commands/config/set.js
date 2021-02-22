'use strict'
/* globals describe beforeEach afterEach it commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find((c) => c.topic === 'config' && c.command === 'set')
const { expect } = require('chai')
const unwrap = require('../../unwrap')
let config

const assertExit = require('../../assert_exit.js')

describe('config:set', () => {
  beforeEach(async () => {
    config = await require('@oclif/config').load()
    cli.mockConsole()
    cli.exit.mock()
  })
  afterEach(() => nock.cleanAll())

  it('sets a config var', async () => {
    const api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/config-vars', { RACK_ENV: 'production' })
      .reply(200, { RACK_ENV: 'production', RAILS_ENV: 'production' })
      .get('/apps/myapp/releases')
      .reply(200, [{ version: 10 }])

    await cmd.run({ config, app: 'myapp', args: ['RACK_ENV=production'] })

    expect(cli.stdout).to.equal('RACK_ENV: production\n');
    expect(cli.stderr).to.equal('Setting RACK_ENV and restarting myapp... done, v10\n');

    return api.done()
  })

  it('sets a config var with an "=" in it', async () => {
    const api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/config-vars', { RACK_ENV: 'production=foo' })
      .reply(200)
      .get('/apps/myapp/releases')
      .reply(200, [{ version: 10 }])

    await cmd.run({ config, app: 'myapp', args: ['RACK_ENV=production=foo'] })

    expect(cli.stdout, 'to be empty');
    expect(cli.stderr).to.equal('Setting RACK_ENV and restarting myapp... done, v10\n');

    return api.done()
  })

  it('errors out on empty', async () => {
    await assertExit(1, cmd.run({ config, app: 'myapp', args: [] }))

    expect(cli.stdout).to.equal('');

    return expect(unwrap(cli.stderr)).to.equal(
        'Usage: heroku config:set KEY1=VALUE1 [KEY2=VALUE2 ...] Must specify KEY and VALUE to set.\n')
  })
})
