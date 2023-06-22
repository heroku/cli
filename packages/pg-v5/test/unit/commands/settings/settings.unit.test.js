'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
// const cmd = require('../../..').commands.find(c => c.topic === 'pg' && c.command === 'copy')

// const db = {
//   id: 1,
//   name: 'postgres-1',
//   plan: {name: 'heroku-postgresql:standard-0'},
// }
// const fetcher = () => {
//   return {
//     addon: () => db,
//   }
// }

// let cmd = proxyquire('../../../../commands/settings/log_statement', {
//   '../../lib/fetcher': fetcher,
// })

const addon = {
  id: 1,
  name: 'postgres-1',
  app: {name: 'myapp'},
  config_vars: ['READONLY_URL', 'DATABASE_URL', 'HEROKU_POSTGRESQL_RED_URL'],
  plan: {name: 'heroku-postgresql:standard-0'},
}

const attachment = {
  name: 'HEROKU_POSTGRESQL_RED',
  app: {name: 'myapp'},
  addon,
}

const db = {
  id: 1,
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
}
const fetcher = () => {
  return {
    addon: () => db,
  }
}

describe.only('pg:settings', () => {
  let cmd
  let api
  let pg

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://postgres-api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {
      addon_attachment: 'test-database',
      addon_service: 'heroku-postgresql',
    }).reply(200, [attachment])
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('shows settings', () => {
    // cmd = require('../../../../').commands.find(c => c.topic === 'pg' && c.command === 'settings:auto-explain')
    cmd = proxyquire('../../../../commands/settings/log_statement', {
      settings: proxyquire.noCallThru().load('../../../../lib/setter', {
        './fetcher': fetcher,
      }),
    })
    // pg.get('/postgres/v0/databases/1/config').reply(200,
    //   {log_statement: {value: 'none'}})
    return cmd.run({args: {database: 'test-database', value: ''}, flags: {}})
      .then(() => expect(cli.stdout).to.equal('=== postgres-1\nlog-statement: none\n'))
  })
})
