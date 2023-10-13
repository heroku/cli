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

const cmd = proxyquire('../../../../commands/credentials/destroy', {
  '../../lib/fetcher': fetcher,
})

describe('pg:credentials:destroy', () => {
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
  })

  it('destroys the credential', () => {
    pg.delete('/postgres/v0/databases/postgres-1/credentials/credname').reply(200)
    let attachments = [
      {
        app: {name: 'myapp'},
        addon: {id: 100, name: 'postgres-1'},
        config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
      },
    ]
    api.get('/addons/postgres-1/addon-attachments').reply(200, attachments)
    return cmd.run({app: 'myapp', args: {}, flags: {name: 'credname', confirm: 'myapp'}})
      .then(() => expect(cli.stderr).to.equal('Destroying credential credname... done\n'))
      .then(() => expect(cli.stdout).to.equal(`The credential has been destroyed within postgres-1.
Database objects owned by credname will be assigned to the default credential.
`))
  })

  it('throws an error when the db is starter plan', () => {
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

    const cmd = proxyquire('../../../../commands/credentials/destroy', {
      '../../lib/fetcher': fetcher,
    })

    const err = 'Essential-tier databases support only one default credential.'
    return expect(cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}})).to.be.rejectedWith(Error, err)
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

    const cmd = proxyquire('../../../../commands/credentials/destroy', {
      '../../lib/fetcher': fetcher,
    })

    const err = 'You can’t perform this operation on Essential-tier databases.'
    return expect(cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}})).to.be.rejectedWith(Error, err)
  })


  it('throws an error when the credential is still used for an attachment', () => {
    let attachments = [
      {
        app: {name: 'myapp'},
        addon: {id: 100, name: 'postgres-1'},
        config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
      },
      {
        app: {name: 'otherapp'},
        addon: {id: 100, name: 'postgres-1'},
        namespace: 'credential:jeff',
        config_vars: ['HEROKU_POSTGRESQL_PURPLE_URL'],
      },
    ]
    api.get('/addons/postgres-1/addon-attachments').reply(200, attachments)

    const err = 'Credential jeff must be detached from the app otherapp before destroying.'
    return expect(cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}})).to.be.rejectedWith(Error, err)
  })

  it('only mentions an app with multiple attachments once', () => {
    let attachments = [
      {
        app: {name: 'myapp'},
        addon: {id: 100, name: 'postgres-1'},
        config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
      },
      {
        app: {name: 'otherapp'},
        addon: {id: 100, name: 'postgres-1'},
        namespace: 'credential:jeff',
        config_vars: ['HEROKU_POSTGRESQL_PURPLE_URL'],
      },
      {
        app: {name: 'otherapp'},
        addon: {id: 100, name: 'postgres-1'},
        namespace: 'credential:jeff',
        config_vars: ['HEROKU_POSTGRESQL_RED_URL'],
      },
      {
        app: {name: 'yetanotherapp'},
        addon: {id: 100, name: 'postgres-1'},
        namespace: 'credential:jeff',
        config_vars: ['HEROKU_POSTGRESQL_BLUE_URL'],
      },
    ]
    api.get('/addons/postgres-1/addon-attachments').reply(200, attachments)

    const err = 'Credential jeff must be detached from the apps otherapp, yetanotherapp before destroying.'
    return expect(cmd.run({app: 'myapp', args: {}, flags: {name: 'jeff'}})).to.be.rejectedWith(Error, err)
  })
})
