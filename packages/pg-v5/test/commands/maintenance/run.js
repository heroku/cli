'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const { expect } = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const db = {
  id: 1,
  name: 'postgres-1',
  plan: { name: 'heroku-postgresql:standard-0' }
}
const fetcher = () => {
  return {
    addon: () => db
  }
}

const cmd = proxyquire('../../../commands/maintenance/run', {
  '../../lib/fetcher': fetcher
})

describe('pg:maintenance', () => {
  let api, pg

  let displayed = ` ▸    The new Data Maintenance CLI plugin improves and extends the
 ▸    pg:maintenance functionality.
 ▸    Follow
 ▸    https://devcenter.heroku.com/articles/data-maintenance-cli-commands#installation
 ▸    to install the plugin and run data:maintenances:run to start a
 ▸    maintenance.
`

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

  it('runs maintenance', () => {
    api.get('/apps/myapp').reply(200, { maintenance: true })
    pg.post('/client/v11/databases/1/maintenance').reply(200, { message: 'foo' })
    return cmd.run({ app: 'myapp', args: {}, flags: {} })
      .then(() => expect(cli.stderr).to.equal(displayed + 'Starting maintenance for postgres-1... foo\n'))
      .then(() => expect(cli.stdout).to.equal(''))
  })
})
