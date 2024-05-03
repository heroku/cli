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
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
}

const fetcher = () => {
  return {
    database: () => db,
    addon: () => addon,
  }
}

const cmd = proxyquire('../../../../commands/credentials/create', {
  '../../lib/fetcher': fetcher,
})

describe('pg:credentials:create', () => {
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

  it('creates the credential', () => {
    pg.post('/postgres/v0/databases/postgres-1/credentials').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {name: 'credname'}})
      .then(() => expect(cli.stdout).to.equal(`
Please attach the credential to the apps you want to use it in by running heroku addons:attach postgres-1 --credential credname -a myapp.
Please define the new grants for the credential within Postgres: heroku pg:psql postgres-1 -a myapp.
`))
      .then(() => expect(cli.stderr).to.equal('Creating credential credname... done\n'))
  })

  it('throws an error when the db is numbered essential plan', () => {
    const essentialAddon = {
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:essential-0'},
    }

    const fetcher = () => {
      return {
        database: () => db,
        addon: () => essentialAddon,
      }
    }

    const cmd = proxyquire('../../../../commands/credentials/create', {
      '../../lib/fetcher': fetcher,
    })

    const err = "You can't create a custom credential on Essential-tier databases."
    return expect(cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}})).to.be.rejectedWith(Error, err)
  })

  it('throws an error when the db is essential plan', () => {
    const hobbyAddon = {
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:mini'},
    }

    const fetcher = () => {
      return {
        database: () => db,
        addon: () => hobbyAddon,
      }
    }

    const cmd = proxyquire('../../../../commands/credentials/create', {
      '../../lib/fetcher': fetcher,
    })

    const err = "You can't create a custom credential on Essential-tier databases."
    return expect(cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}})).to.be.rejectedWith(Error, err)
  })
})
