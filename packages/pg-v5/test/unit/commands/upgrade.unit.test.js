'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

let addon
const fetcher = () => {
  return {
    addon: () => addon,
  }
}

const cmd = proxyquire('../../../commands/upgrade', {
  '../lib/fetcher': fetcher,
})

describe('pg:upgrade', () => {
  let api
  let pg

  beforeEach(() => {
    addon = {
      id: 1,
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:standard-0'},
    }

    api = nock('https://api.heroku.com')
    pg = nock('https://api.data.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('refuses to upgrade essential dbs', () => {
    addon.plan = {name: 'heroku-postgresql:hobby-dev'}

    return expect(cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp'}}))
      .to.be.rejectedWith(Error, 'pg:upgrade is only available for follower databases on at least the Standard tier.')
  })

  it('refuses to upgrade legacy essential dbs', () => {
    addon.plan = {name: 'heroku-postgresql:basic'}

    return expect(cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp'}}))
      .to.be.rejectedWith(Error, 'pg:upgrade is only available for follower databases on at least the Standard tier.')
  })

  it('upgrades db', () => {
    api.get('/apps/myapp/config-vars').reply(200, {DATABASE_URL: 'postgres://db1'})
    pg.get('/client/v11/databases/1').reply(200, {following: 'postgres://db1'})
    pg.post('/client/v11/databases/1/upgrade').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp'}})
      .then(() => expect(cli.stderr).to.equal('Starting upgrade of postgres-1... heroku pg:wait to track status\n'))
  })

  it('upgrades db with version flag', () => {
    api.get('/apps/myapp/config-vars').reply(200, {DATABASE_URL: 'postgres://db1'})
    pg.get('/client/v11/databases/1').reply(200, {following: 'postgres://db1'})
    pg.post('/client/v11/databases/1/upgrade').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp', version: '9.6'}})
      .then(() => expect(cli.stderr).to.equal('Starting upgrade of postgres-1... heroku pg:wait to track status\n'))
  })
})
