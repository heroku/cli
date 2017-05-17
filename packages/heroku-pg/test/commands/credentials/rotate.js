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

const cmd = proxyquire('../../../commands/credentials/rotate', {
  '../../lib/fetcher': fetcher
})

describe('pg:credentials:rotate', () => {
  let api, pg, starter

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://postgres-api.heroku.com')
    starter = nock('https://postgres-starter-api.heroku.com')
    cli.mockConsole()
    cli.exit.mock()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  it('rotates credentials for a specific role with --name', () => {
    pg.post('/postgres/v0/databases/postgres-1/credentials/my_role/credentials_rotation').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {name: 'my_role', confirm: 'myapp'}})
              .then(() => expect(cli.stdout, 'to equal', ''))
              .then(() => expect(cli.stderr, 'to equal', 'Rotating my_role on postgres-1... done\n'))
  })

  it('rotates credentials for all roles with --all', () => {
    pg.post('/postgres/v0/databases/postgres-1/credentials_rotation').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {all: true, confirm: 'myapp'}})
              .then(() => expect(cli.stdout, 'to equal', ''))
              .then(() => expect(cli.stderr, 'to equal', 'Rotating all credentials on postgres-1... done\n'))
  })

  it('rotates credentials for a specific role with --name and --force', () => {
    pg.post('/postgres/v0/databases/postgres-1/credentials/my_role/credentials_rotation').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {name: 'my_role', confirm: 'myapp', force: true}})
        .then(() => expect(cli.stdout, 'to equal', ''))
    .then(() => expect(cli.stderr, 'to equal', 'Rotating my_role on postgres-1... done\n'))
  })

  it('rotates credentials for all roles with --all and --force', () => {
    pg.post('/postgres/v0/databases/postgres-1/credentials_rotation').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {all: true, confirm: 'myapp', force: true}})
        .then(() => expect(cli.stdout, 'to equal', ''))
    .then(() => expect(cli.stderr, 'to equal', 'Rotating all credentials on postgres-1... done\n'))
  })

  it('fails with an error if both --all and --name are included', () => {
    return cmd.run({app: 'myapp', args: {}, flags: {all: true, name: 'my_role', confirm: 'myapp'}})
              .then(() => { throw new Error('expected error') })
              .catch((err) => {
                expect(err.message, 'to equal', 'cannot pass both --all and --name')
                expect(err.code, 'to equal', 1)
              })
  })

  it('throws an error when the db is starter plan but the name is specified', () => {
    const hobbyAddon = {
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:hobby-dev'}
    }

    const fetcher = () => {
      return {
        database: () => db,
        addon: () => hobbyAddon
      }
    }

    const cmd = proxyquire('../../../commands/credentials/rotate', {
      '../../lib/fetcher': fetcher
    })

    const err = new Error('This operation is not supported by Hobby tier databases.')
    return expect(cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}}), 'to be rejected with', err)
  })

  it('rotates credentials with no --name with starter plan', () => {
    const hobbyAddon = {
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:hobby-dev'}
    }

    const fetcher = () => {
      return {
        database: () => db,
        addon: () => hobbyAddon
      }
    }

    const cmd = proxyquire('../../../commands/credentials/rotate', {
      '../../lib/fetcher': fetcher
    })

    starter.post('/postgres/v0/databases/postgres-1/credentials/default/credentials_rotation').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp'}})
              .then(() => expect(cli.stdout, 'to equal', ''))
              .then(() => expect(cli.stderr, 'to equal', 'Rotating default on postgres-1... done\n'))
  })

  it('rotates credentials with --all with starter plan', () => {
    const hobbyAddon = {
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:hobby-dev'}
    }

    const fetcher = () => {
      return {
        database: () => db,
        addon: () => hobbyAddon
      }
    }

    const cmd = proxyquire('../../../commands/credentials/rotate', {
      '../../lib/fetcher': fetcher
    })

    starter.post('/postgres/v0/databases/postgres-1/credentials_rotation').reply(200)
    return cmd.run({app: 'myapp', args: {}, flags: {all: true, confirm: 'myapp'}})
              .then(() => expect(cli.stdout, 'to equal', ''))
              .then(() => expect(cli.stderr, 'to equal', 'Rotating all credentials on postgres-1... done\n'))
  })
})
