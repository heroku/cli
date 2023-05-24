'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const addon = {
  id: 1,
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
}
const fetcher = () => {
  return {
    addon: () => addon,
  }
}

const cmd = proxyquire('../../../commands/unfollow', {
  '../lib/fetcher': fetcher,
})

describe('pg:unfollow', () => {
  let api
  let pg

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://postgres-api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('unfollows db', () => {
    api.get('/apps/myapp/config-vars').reply(200, {DATABASE_URL: 'postgres://db1'})
    pg.get('/client/v11/databases/1').reply(200, {following: 'postgres://db1'})
    pg.put('/client/v11/databases/1/unfollow').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp'}})
      .then(() => expect(cli.stderr).to.equal('postgres-1 unfollowing... done\n'))
  })
})
