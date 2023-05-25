'use strict'
/* global beforeEach afterEach */

const nock = require('nock')
const getConfig = require('../../../lib/config')
const {expect} = require('chai')
const Heroku = require('heroku-client')

describe('config', () => {
  let api

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    nock.cleanAll()

    getConfig.clear()
  })

  afterEach(() => {
    api.done()
  })

  it('caches the config vars', () => {
    let expectedMyapp = {DATABASE_URL: 'postgres://pguser:pgpass@pghost.com/pgdb'}
    let expectedFooapp = {FOO_URL: 'postgres://pguser:pgpass@pghost.com/pgdb'}

    api.get('/apps/myapp/config-vars').reply(200, expectedMyapp)

    return getConfig(new Heroku(), 'myapp')
      .then(config => expect(config).to.deep.equal(expectedMyapp))
      .then(() => {
        api.get('/apps/fooapp/config-vars').reply(200, expectedFooapp)

        return getConfig(new Heroku(), 'fooapp')
      })
      .then(config => expect(config).to.deep.equal(expectedFooapp))
      .then(() => {
        return getConfig(new Heroku(), 'myapp')
      })
      .then(config => expect(config).to.deep.equal(expectedMyapp))
  })
})
