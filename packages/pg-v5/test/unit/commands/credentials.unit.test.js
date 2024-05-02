'use strict'
/* global beforeEach afterEach */

const cli = require('@heroku/heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const db = {
  database: 'mydb',
  host: 'foo.com',
  user: 'jeff',
  password: 'pass',
  url: {href: 'postgres://jeff:pass@foo.com/mydb'},
}

const addon = {
  id: 1,
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
}

const fetcher = () => {
  return {
    database: () => db,
    addon: () => addon,
  }
}

const cmd = proxyquire('../../../commands/credentials', {
  '../lib/fetcher': fetcher,
})

describe('pg:credentials', () => {
  let api
  let pg

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://api.data.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  it('shows the correct credentials', () => {
    let credentials = [
      {uuid: 'aaaa',
        name: 'ransom',
        state: 'active',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: []},
      {uuid: 'aaab',
        name: 'default',
        state: 'active',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: []},
      {uuid: 'aabb',
        name: 'jeff',
        state: 'rotating',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: [
          {
            user: 'jeff',
            connections: 0,
            state: 'revoking',
          },
          {
            user: 'jeff-rotating',
            connections: 2,
            state: 'active',
          },
        ]},
    ]
    let attachments = [
      {
        app: {name: 'main-app'},
        name: 'DATABASE',
        namespace: null,
      },
      {
        app: {name: 'main-app'},
        name: 'HEROKU_POSTGRESQL_GREEN',
        namespace: 'credential:jeff',
      },
      {
        app: {name: 'another-app'},
        name: 'HEROKU_POSTGRESQL_PINK',
        namespace: 'credential:jeff',
      },
      {
        app: {name: 'yet-another-app'},
        name: 'HEROKU_POSTGRESQL_BLUE',
        namespace: 'credential:ransom',
      },
    ]
    api.get('/addons/1/addon-attachments').reply(200, attachments)
    pg.get('/postgres/v0/databases/1/credentials').reply(200, credentials)

    let displayed = `Credential                                                                     State
─────────────────────────────────────────────────────────────────────────────  ────────
default                                                                        active
 └─ as DATABASE on main-app app
jeff                                                                           rotating
 ├─ as HEROKU_POSTGRESQL_GREEN on main-app app
 └─ as HEROKU_POSTGRESQL_PINK on another-app app
       Usernames currently active for this credential:
       jeff           waiting for no connections to be revoked  0 connections
       jeff-rotating  active                                    2 connections
ransom                                                                         active
 └─ as HEROKU_POSTGRESQL_BLUE on yet-another-app app
`

    return cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}})
      .then(() => expect(cli.stdout).to.equal(displayed))
  })

  it('shows the correct rotation information if no connection information is available yet', () => {
    let credentials = [
      {uuid: 'aaaa',
        name: 'ransom',
        state: 'active',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: []},
      {uuid: 'aaab',
        name: 'default',
        state: 'active',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: []},
      {uuid: 'aabb',
        name: 'jeff',
        state: 'rotating',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: [
          {
            user: 'jeff',
            state: 'active',
          },
          {
            user: 'jeff-rotating',
            state: 'enabling',
          },
        ]},
    ]
    let attachments = [
      {
        app: {name: 'main-app'},
        name: 'DATABASE',
        namespace: null,
      },
      {
        app: {name: 'main-app'},
        name: 'HEROKU_POSTGRESQL_GREEN',
        namespace: 'credential:jeff',
      },
      {
        app: {name: 'another-app'},
        name: 'HEROKU_POSTGRESQL_PINK',
        namespace: 'credential:jeff',
      },
      {
        app: {name: 'yet-another-app'},
        name: 'HEROKU_POSTGRESQL_BLUE',
        namespace: 'credential:ransom',
      },
    ]
    api.get('/addons/1/addon-attachments').reply(200, attachments)
    pg.get('/postgres/v0/databases/1/credentials').reply(200, credentials)

    let displayed = `Credential                                            State
────────────────────────────────────────────────────  ────────
default                                               active
 └─ as DATABASE on main-app app
jeff                                                  rotating
 ├─ as HEROKU_POSTGRESQL_GREEN on main-app app
 └─ as HEROKU_POSTGRESQL_PINK on another-app app
ransom                                                active
 └─ as HEROKU_POSTGRESQL_BLUE on yet-another-app app
`

    return cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}})
      .then(() => expect(cli.stdout).to.equal(displayed))
  })
})
