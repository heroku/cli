'use strict'
/* global context beforeEach afterEach */

const {expect} = require('chai')
let host = require('../../../lib/host')

describe('host', () => {
  it('shows prod host', () => {
    expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://postgres-api.heroku.com')
  })

  context('with HEROKU_POSTGRESQL_HOST set', () => {
    beforeEach(() => {
      process.env.HEROKU_POSTGRESQL_HOST = 'foo.herokuapp.com'
    })
    afterEach(() => delete process.env.HEROKU_POSTGRESQL_HOST)

    it('shows shogun host', () => {
      expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://foo.herokuapp.com')
    })
  })
})
