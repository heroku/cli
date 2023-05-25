'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const addon = {
  id: 1,
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
}

const cmd = proxyquire('../../../../commands/links/create', {
  '@heroku-cli/plugin-addons': {
    resolve: {addon: () => addon},
  },
  '../../lib/fetcher': () => ({
    all: () => [addon],
    addon: () => addon,
  }),
})

describe('pg:links:create', () => {
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

  it('creates a link', () => {
    pg.post('/client/v11/databases/1/links', {target: 'postgres-1', as: 'foobar'}).reply(200, {name: 'foobar'})
    return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp', as: 'foobar'}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('Adding link from postgres-1 to postgres-1... done, foobar\n'))
  })
})
