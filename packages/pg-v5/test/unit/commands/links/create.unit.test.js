'use strict'
/* global beforeEach afterEach */

const cli = require('@heroku/heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const buildCmd = addon => {
  return proxyquire('../../../../commands/links/create', {
    '@heroku-cli/plugin-addons': {
      resolve: {addon: () => addon},
    },
    '../../lib/fetcher': () => ({
      all: () => [addon],
      addon: () => addon,
    }),
  })
}

describe('pg:links:create', () => {
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

  describe('on an essential database', () => {
    let addon = {
      id: 2,
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:basic'},
    }
    let cmd = buildCmd(addon)

    it('errors when attempting to create a link', () => {
      return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp', as: 'foobar'}})
        .catch(error => {
          expect(error.message).to.equal('pg:links isn’t available for Essential-tier databases.')
        })
    })
  })

  describe('on a production database', () => {
    let addon = {
      id: 1,
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:standard-0'},
    }
    let cmd = buildCmd(addon)

    it('creates a link', () => {
      pg.post('/client/v11/databases/1/links', {target: 'postgres-1', as: 'foobar'}).reply(200, {name: 'foobar'})
      return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp', as: 'foobar'}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.equal('Adding link from postgres-1 to postgres-1... done, foobar\n'))
    })
  })
})
