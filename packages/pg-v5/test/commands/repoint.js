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

const cmd = proxyquire('../../commands/repoint', {
  '../lib/fetcher': fetcher,
})

describe('pg:repoint', () => {
  let api
  let pg

  beforeEach(() => {
    addon = {
      id: 1,
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:standard-0'},
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

  it('refuses to repoint essential dbs', () => {
    addon.plan = {name: 'heroku-postgresql:hobby-dev'}

    return expect(cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp'}}))
      .to.be.rejectedWith(Error, 'pg:repoint is only available for follower databases on at least the Standard tier.')
  })

  it('refuses to repoint non-follower dbs', () => {
    pg.get('/client/v11/databases/1').reply(200, {forked_from: 'postgres://db1'})

    return expect(cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp'}}))
      .to.be.rejectedWith(Error, 'pg:repoint is only available for follower databases on at least the Standard tier.')
  })

  it('repoints db', () => {
    api.get('/apps/myapp/config-vars').reply(200, {DATABASE_URL: 'postgres://db1'})
    pg.get('/client/v11/databases/1').reply(200, {following: 'postgres://db1'})
    pg.post('/client/v11/databases/1/repoint').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp', follow: 'NEW_LEADER'}})
      .then(() => expect(cli.stderr).to.contain('Starting repoint of postgres-1... heroku pg:wait to track status\n'))
  })
})
