'use strict'
/* global beforeEach afterEach context */

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
  id: '1234',
  plan: {name: 'heroku-postgresql:standard-0'},
}

const fetcher = () => {
  return {
    database: () => db,
    addon: () => addon,
  }
}

const cmd = proxyquire('../../commands/connection_pooling', {
  '../lib/fetcher': fetcher,
})

describe('pg:connection-polling:attach', () => {
  let api
  let pg
  let defaultCredential = 'default'
  let readonlyCredential = 'readonly'
  let attachmentName = 'CONNECTION_POOL'

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://postgres-api.heroku.com')
    api.get('/addons/postgres-1').reply(200, addon)
    api.get('/apps/myapp/releases').reply(200, [{version: 0}])

    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
    api.done()
  })

  context('includes an attachment name', () => {
    beforeEach(() => {
      pg.post(`/client/v11/databases/${addon.name}/connection-pooling`, {
        credential: defaultCredential,
        name: attachmentName,
        app: 'myapp',
      }).reply(201, {name: attachmentName})
    })

    it('attaches pgbouncer with attachment name', () => {
      return cmd.run({app: 'myapp', args: {database: 'postgres-1'}, flags: {as: attachmentName}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.contain('Enabling Connection Pooling on'))
        .then(() => expect(cli.stderr).to.contain(`Setting ${attachmentName} config vars and restarting myapp... done, v0\n`))
    })
  })

  context('base command with no credential or attachment name', () => {
    beforeEach(() => {
      pg.post(`/client/v11/databases/${addon.name}/connection-pooling`, {
        credential: defaultCredential,
        app: 'myapp',
      }).reply(201, {name: 'HEROKU_COLOR'})
    })

    it('attaches pgbouncer with default credential', () => {
      return cmd.run({app: 'myapp', args: {database: 'postgres-1'}, flags: {}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.contain('Enabling Connection Pooling on'))
        .then(() => expect(cli.stderr).to.contain('Setting HEROKU_COLOR config vars and restarting myapp... done, v0\n'))
    })
  })
})
