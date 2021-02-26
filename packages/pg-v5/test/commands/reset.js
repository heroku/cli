'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const { expect } = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const addon = {
  id: 1,
  name: 'postgres-1',
  plan: { name: 'heroku-postgresql:standard-0' }
}
const fetcher = () => {
  return {
    addon: () => addon
  }
}

const cmd = proxyquire('../../commands/reset', {
  '../lib/fetcher': fetcher
})

describe('pg:reset', () => {
  let api, pg

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://postgres-api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
    api.done()
  })

  it('reset db', async () => {
    pg.put('/client/v11/databases/1/reset').reply(200)
    await cmd.run({ app: 'myapp', args: {}, flags: { confirm: 'myapp' } })
    return expect(cli.stderr).to.equal('Resetting postgres-1... done\n')
  })
})
