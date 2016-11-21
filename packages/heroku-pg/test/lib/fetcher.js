'use strict'
/* global describe beforeEach afterEach it */

const nock = require('nock')
const expect = require('unexpected')
const proxyquire = require('proxyquire')
const resolver = {}
const fetcher = proxyquire('../../lib/fetcher', {'heroku-cli-addons': {resolve: resolver}})
const Heroku = require('heroku-client')
const sinon = require('sinon')

describe('fetcher', () => {
  let api
  let stub

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')

    stub = sinon.stub()
    stub.throws('not stubbed')

    resolver.attachment = stub
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  describe('addon', () => {
    it('returns addon attached to app', () => {
      stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL').returns(Promise.resolve({addon: {name: 'postgres-1'}}))
      return fetcher(new Heroku()).addon('myapp', 'DATABASE_URL')
      .then(addon => {
        expect(addon.name, 'to equal', 'postgres-1')
      })
    })
  })

  describe('database', () => {
    it('returns db connection info', () => {
      let addonApp = {name: 'addon-app'}
      let app = {name: 'myapp'}
      stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL').returns(Promise.resolve(
        {addon: {id: 100, name: 'postgres-1', app: addonApp}, app, config_vars: ['DATABASE_URL']}
      ))
      api.get('/apps/myapp/config-vars').reply(200, {
        'DATABASE_URL': 'postgres://pguser:pgpass@pghost.com/pgdb'
      })
      return fetcher(new Heroku()).database('myapp', 'DATABASE_URL')
      .then(db => expect(db.user, 'to equal', 'pguser'))
    })
  })

  describe('all', () => {
    it('returns all addons attached to app', () => {
      let plan = {name: 'heroku-postgresql:hobby-dev'}
      let attachments = [
        {addon: {id: 100, name: 'postgres-1', plan, config_vars: ['DATABASE_URL', 'HEROKU_POSTGRESQL_PINK_URL']}},
        {addon: {id: 101, name: 'postgres-2', plan, config_vars: ['HEROKU_POSTGRESQL_BRONZE_URL']}}
      ]
      api.get('/apps/myapp/addon-attachments').reply(200, attachments)

      return fetcher(new Heroku()).all('myapp')
      .then(addons => {
        expect(addons[0], 'to satisfy', {name: 'postgres-1'})
        expect(addons[1], 'to satisfy', {name: 'postgres-2'})
        expect(addons.length, 'to equal', 2)
      })
    })
  })
})
