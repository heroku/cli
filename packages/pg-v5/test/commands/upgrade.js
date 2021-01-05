'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const { expect } = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

let addon
const fetcher = () => {
  return {
    addon: () => addon
  }
}

const cmd = proxyquire('../../commands/upgrade', {
  '../lib/fetcher': fetcher
})

describe('pg:upgrade', () => {
  let api, pg

  beforeEach(() => {
    addon = {
      id: 1,
      name: 'postgres-1',
      plan: { name: 'heroku-postgresql:standard-0' }
    }

    api = nock('https://api.heroku.com')
    pg = nock('https://postgres-api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('refuses to upgrade hobby dbs', () => {
    addon.plan = { name: 'heroku-postgresql:hobby-dev' }

    return expect(cmd.run({ app: 'myapp', args: {}, flags: { confirm: 'myapp' } }))
      .to.be.rejectedWith(Error, 'pg:upgrade is only available for follower production databases')
  })

  it('refuses to upgrade non-follower dbs', () => {
    pg.get('/client/v11/databases/1').reply(200, { forked_from: 'postgres://db1' })
    pg.get('/client/v11/databases/1/upgrade_status').reply(200, {})

    return expect(cmd.run({ app: 'myapp', args: {}, flags: { confirm: 'myapp' } }))
      .to.be.rejectedWith(Error, 'pg:upgrade is only available for follower production databases')
  })

  it('upgrades db', () => {
    api.get('/apps/myapp/config-vars').reply(200, { DATABASE_URL: 'postgres://db1' })
    pg.get('/client/v11/databases/1').reply(200, { following: 'postgres://db1' })
    pg.get('/client/v11/databases/1/upgrade_status').reply(200, {})
    pg.post('/client/v11/databases/1/upgrade').reply(200)
    return cmd.run({ app: 'myapp', args: {}, flags: { confirm: 'myapp' } })
      .then(() => expect(cli.stderr).to.equal('Starting upgrade of postgres-1... heroku pg:wait to track status\n'))
  })

  it('upgrades db with version flag', () => {
    api.get('/apps/myapp/config-vars').reply(200, { DATABASE_URL: 'postgres://db1' })
    pg.get('/client/v11/databases/1').reply(200, { following: 'postgres://db1' })
    pg.get('/client/v11/databases/1/upgrade_status').reply(200, {})
    pg.post('/client/v11/databases/1/upgrade').reply(200)
    return cmd.run({ app: 'myapp', args: {}, flags: { confirm: 'myapp', version: '9.6' } })
      .then(() => expect(cli.stderr).to.equal('Starting upgrade of postgres-1... heroku pg:wait to track status\n'))
  })
})
