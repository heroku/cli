'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const proxyquire = require('proxyquire')

const db = {
  database: 'mydb',
  host: 'foo.com',
  user: 'jeff',
  password: 'pass',
  url: {href: 'postgres://jeff:pass@foo.com/mydb'}
}

const addon = {
  id: 1,
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'}
}

const fetcher = () => {
  return {
    database: () => db,
    addon: () => addon
  }
}

const cmd = proxyquire('../../commands/credentials', {
  '../lib/fetcher': fetcher
})

describe('pg:credentials', () => {
  let api, pg

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://postgres-api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  // Old behaviour
  it('runs query', () => {
    // Returns an error for non-whitelisted databases
    pg.get('/postgres/v0/databases/postgres-1/credentials').reply(422)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stdout, 'to equal', `Connection info string:
   "dbname=mydb host=foo.com port=5432 user=jeff password=pass sslmode=require"
Connection URL:
   postgres://jeff:pass@foo.com/mydb
`))
  })

  it('resets credentials', () => {
    pg.post('/client/v11/databases/1/credentials_rotation').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {reset: true}})
    .then(() => expect(cli.stdout, 'to equal', ''))
    .then(() => expect(cli.stderr, 'to equal', 'Resetting credentials on postgres-1... done\n'))
  })

  // Private beta behaviour
  it('shows the correct credentials', () => {
    let credentials = [
      { uuid: 'aaaa',
        name: 'jeff',
        state: 'created',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: [] },
      { uuid: 'aabb',
        name: 'ransom',
        state: 'rotating',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: [] }
    ]
    pg.get('/postgres/v0/databases/postgres-1/credentials').reply(200, credentials)

    return cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}})
              .then(() => expect(cli.stdout,
                                 'to equal',
                                 'Credential  State\n──────────  ────────\njeff        created\nransom      rotating\n'))
  })
})
