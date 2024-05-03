'use strict'
/* global beforeEach afterEach */

const cli = require('@heroku/heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')
const unwrap = require('../../unwrap')

const all = [
  {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'}},
  {id: 2, name: 'postgres-2', plan: {name: 'heroku-postgresql:hobby-dev'}},
]
const fetcher = () => {
  return {
    all: () => Promise.resolve(all),
    addon: () => Promise.resolve(all[0]),
  }
}

const cmd = proxyquire('../../../commands/wait', {
  '../lib/fetcher': fetcher,
})

describe('pg:wait', () => {
  let pg

  beforeEach(() => {
    cli.mockConsole()
    cli.exit.mock()
    pg = nock('https://api.data.heroku.com:443')
  })

  afterEach(() => {
    pg.done()
    nock.cleanAll()
  })

  it('waits for a database to be available', () => {
    pg
      .get('/client/v11/databases/1/wait_status').reply(200, {'waiting?': true, message: 'pending'})
      .get('/client/v11/databases/1/wait_status').reply(200, {'waiting?': false, message: 'available'})

    return cmd.run({app: 'myapp', args: {database: 'DATABASE_URL'}, flags: {'wait-interval': '1'}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal(`Waiting for database postgres-1... pending
Waiting for database postgres-1... available
`))
  })

  it('waits for all databases to be available', () => {
    pg
      .get('/client/v11/databases/1/wait_status').reply(200, {'waiting?': false})
      .get('/client/v11/databases/2/wait_status').reply(200, {'waiting?': false})

    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal(''))
  })

  it('displays errors', () => {
    pg
      .get('/client/v11/databases/1/wait_status').reply(200, {'error?': true, message: 'this is an error message'})

    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .catch(error => {
        if (error.code !== 1) throw error
        expect(cli.stdout).to.equal('')
        expect(unwrap(cli.stderr)).to.equal('this is an error message\n')
      })
  })
})
