'use strict'
/* global describe beforeEach afterEach it */

const nock = require('nock')
const expect = require('unexpected')
const proxyquire = require('proxyquire')
const resolver = {}
const fetcher = proxyquire('../../lib/fetcher', {'heroku-cli-addons': {resolve: resolver}})
const Heroku = require('heroku-client')

describe('fetcher', () => {
  let api

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  describe('addon', () => {
    it('returns addon attached to app', () => {
      resolver.attachment = (_, app, db) => {
        if (app === 'myapp' && db === 'DATABASE_URL') {
          return Promise.resolve({addon: {name: 'postgres-1'}})
        }
        return Promise.resolve()
      }
      return fetcher(new Heroku()).addon('myapp', 'DATABASE_URL')
      .then(addon => {
        expect(addon.name, 'to equal', 'postgres-1')
      })
    })
  })

  describe('database', () => {
    it('returns db connection info', () => {
      resolver.attachment = (_, app, db) => {
        if (app === 'myapp' && db === 'DATABASE_URL') {
          return Promise.resolve({addon: {id: 100, name: 'postgres-1'}})
        }
        return Promise.resolve()
      }
      api.get('/addons/100').reply(200, {
        config_vars: ['DATABASE_URL']
      })
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
      let service = {name: 'heroku-postgresql'}
      let attachments = [
        {addon: {id: 100, name: 'postgres-1', addon_service: service, plan, config_vars: ['DATABASE_URL', 'HEROKU_POSTGRESQL_PINK_URL']}},
        {addon: {id: 101, name: 'postgres-2', addon_service: service, plan, config_vars: ['HEROKU_POSTGRESQL_BRONZE_URL']}}
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
