'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
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
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
}

const fetcher = () => {
  return {
    database: () => db,
    addon: () => addon,
  }
}

const cmd = proxyquire('../../../../commands/credentials/url', {
  '../../lib/fetcher': fetcher,
})

describe('pg:credentials:url', () => {
  let api
  let pg
  let starter

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://postgres-api.heroku.com')
    starter = nock('https://postgres-starter-api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  it('shows the correct credentials', () => {
    let roleInfo = {
      uuid: 'aaaa',
      name: 'jeff',
      state: 'created',
      database: 'd123',
      host: 'localhost',
      port: 5442,
      credentials: [
        {
          user: 'jeff-rotating',
          password: 'passw0rd',
          state: 'revoking',
        },
        {
          user: 'jeff',
          password: 'hunter2',
          state: 'active',
        },
      ],
    }
    pg.get('/postgres/v0/databases/postgres-1/credentials/jeff').reply(200, roleInfo)

    return cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}})
      .then(() => expect(cli.stdout).to.equal(`Connection information for jeff credential.\nConnection info string:
   "dbname=d123 host=localhost port=5442 user=jeff password=hunter2 sslmode=require"
Connection URL:
   postgres://jeff:hunter2@localhost:5442/d123
`))
  })

  it('throws an error when the db is starter plan but the name is specified', () => {
    const hobbyAddon = {
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:hobby-dev'},
    }

    const fetcher = () => {
      return {
        database: () => db,
        addon: () => hobbyAddon,
      }
    }

    const cmd = proxyquire('../../../../commands/credentials/url', {
      '../../lib/fetcher': fetcher,
    })

    const err = 'Essential-tier databases support only one default credential.'
    return expect(cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}})).to.be.rejectedWith(Error, err)
  })

  it('shows the correct credentials with starter plan', () => {
    const hobbyAddon = {
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:hobby-dev'},
    }

    const fetcher = () => {
      return {
        database: () => db,
        addon: () => hobbyAddon,
      }
    }

    const cmd = proxyquire('../../../../commands/credentials/url', {
      '../../lib/fetcher': fetcher,
    })

    let roleInfo = {
      uuid: null,
      name: 'default',
      state: 'created',
      database: 'd123',
      host: 'localhost',
      port: 5442,
      credentials: [
        {
          user: 'abcdef',
          password: 'hunter2',
          state: 'active',
        },
      ],
    }
    starter.get('/postgres/v0/databases/postgres-1/credentials/default').reply(200, roleInfo)

    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`Connection information for default credential.\nConnection info string:
   "dbname=d123 host=localhost port=5442 user=abcdef password=hunter2 sslmode=require"
Connection URL:
   postgres://abcdef:hunter2@localhost:5442/d123
`))
  })
})
