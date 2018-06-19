'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const proxyquire = require('proxyquire')

const db = {
  id: 1,
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'}
}
const fetcher = () => {
  return {
    addon: () => db
  }
}

const cmd = proxyquire('../../../commands/maintenance', {
  '../../lib/fetcher': fetcher
})

describe('pg:maintenance', () => {
  let api, pg

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

  it('shows maintenance', () => {
    pg.get('/client/v11/databases/1/maintenance').reply(200, {message: 'foo'})
    return cmd.run({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stdout, 'to equal', 'foo\n'))
  })
})
