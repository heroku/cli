'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const proxyquire = require('proxyquire')

const addon = {
  id: 1,
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'}
}
const fetcher = () => {
  return {
    all: () => [addon],
    addon: () => addon
  }
}

const cmd = proxyquire('../../../commands/links', {
  '../../lib/fetcher': fetcher
})

describe('pg:links', () => {
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

  it('shows links', () => {
    pg.get('/client/v11/databases/1/links').reply(200, [
      {name: 'redis-link-1', created_at: '100', remote: {attachment_name: 'REDIS', name: 'redis-001'}}
    ])
    return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp'}})
      .then(() => expect(cli.stdout, 'to equal', `=== postgres-1

 * redis-link-1
created_at: 100
remote:     REDIS (redis-001)
`))
  })
})
