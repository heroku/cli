'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const db = {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'}}
const fetcher = () => {
  return {
    addon: () => db,
  }
}

const cmd = proxyquire('../../../commands/relocate_heroku_ext_extensions', {
  '../lib/fetcher': fetcher,
})

describe('pg:relocate-heroku-ext-extensions', () => {
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
    pg.done()
  })

  it('sends api request to control plane', () => {
    let message = `Extensions on ${db.name} are being migrated from 'heroku_ext' to 'public'. This operation may take a few minutes.`

    pg.post(`/client/v11/databases/${db.name}/migrate_extensions_to_public_schema`).reply(200,
      {message: message})

    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`${message}\n`))
  })
})
