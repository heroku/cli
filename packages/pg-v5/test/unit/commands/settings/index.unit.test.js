'use strict'
/* global beforeEach afterEach */

const cli = require('@heroku/heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

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

const cmd = proxyquire('../../../../commands/settings', {
  '../../lib/fetcher': fetcher,
})

describe('pg:settings', () => {
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
    pg.done()
  })

  it('shows settings', () => {
    pg.get('/postgres/v0/databases/1/config').reply(200,
      {log_statement: {value: 'none'}})
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout).to.equal('=== postgres-1\nlog-statement: none\n'))
  })
})
