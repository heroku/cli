'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')
const psql = require('../../../lib/psql')
const sinon = require('sinon')

let execStub = sinon.stub(psql, 'exec').returns('test-run-complete')

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
    database: () => db,
  }
}

describe('pg:settings', () => {
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

  it('shows settings for settings/index', () => {
    cmd = proxyquire('../../../commands/blocking', {
      '../lib/fetcher': fetcher,
      '../lib/psql': execStub,
    })
    return cmd[0].run({args: {database: 'test-database', value: ''}, flags: {}})
      .then(() => expect(execStub.calledOnce).to.equal(true))
  })
})
