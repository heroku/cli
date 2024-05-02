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

const cmd = proxyquire('../../../../commands/maintenance/window', {
  '../../lib/fetcher': fetcher,
})

describe('pg:maintenance', () => {
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

  it('sets maintenance window', () => {
    pg.put('/client/v11/databases/1/maintenance_window', {description: 'Sunday 06:30'}).reply(200)
    return cmd.run({app: 'myapp', args: {window: 'Sunday 06:30'}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('Setting maintenance window for postgres-1 to Sunday 06:30... done\n'))
  })
})
