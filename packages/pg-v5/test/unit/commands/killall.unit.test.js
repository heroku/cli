'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const db = {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'}}
const fetcher = () => {
  return {
    addon: () => db,
  }
}

const cmd = proxyquire('../../../commands/killall', {
  '../lib/fetcher': fetcher,
})

describe('pg:killall', () => {
  let pg

  beforeEach(() => {
    cli.mockConsole()
    cli.exit.mock()
    pg = nock('https://postgres-starter-api.heroku.com:443')
  })

  afterEach(() => {
    pg.done()
    nock.cleanAll()
  })

  it('waits for all databases to be available', () => {
    pg
      .post('/client/v11/databases/1/connection_reset').reply(200)

    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('Terminating connections for all credentials... done\n'))
  })
})
