'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const buildCmd = addon => {
  return proxyquire('../../../../commands/links/destroy', {
    '@heroku-cli/plugin-addons': {
      resolve: {addon: () => addon},
    },
    '../../lib/fetcher': () => ({
      all: () => [addon],
      addon: () => addon,
    }),
  })
}

describe('pg:links:destroy', () => {
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
      id: 1,
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:mini'},
    }
    let cmd = buildCmd(addon)

    it('errors when attempting to destroy a link', () => {
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

    it('destroys a link', () => {
      pg.delete('/client/v11/databases/1/links/redis').reply(200)
      return cmd.run({app: 'myapp', args: {link: 'redis'}, flags: {confirm: 'myapp'}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.equal('Destroying link redis from postgres-1... done\n'))
    })
  })
})
