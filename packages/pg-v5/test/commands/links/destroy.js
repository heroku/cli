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

const cmd = proxyquire('../../../commands/links/destroy', {
  '@heroku-cli/plugin-addons': {
    resolve: {addon: () => addon},
  },
  '../../lib/fetcher': () => ({
    all: () => [addon],
    addon: () => addon,
  }),
})

describe('pg:links:destroy', () => {
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

  it('destroys a link', () => {
    pg.delete('/client/v11/databases/1/links/redis').reply(200)
    return cmd.run({app: 'myapp', args: {link: 'redis'}, flags: {confirm: 'myapp'}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('Destroying link redis from postgres-1... done\n'))
  })
})
