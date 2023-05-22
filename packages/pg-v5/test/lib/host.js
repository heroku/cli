'use strict'
/* global context beforeEach afterEach */

const {expect} = require('chai')
let host = require('../../lib/host')

describe('host', () => {
  it('shows dev host', () => {
    expect(host({plan: {name: 'heroku-postgresql:hobby-dev'}})).to.equal('https://postgres-starter-api.heroku.com')
  })

  it('shows prod host', () => {
    expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://postgres-api.heroku.com')
  })

  context('with HEROKU_POSTGRESQL_HOST set', () => {
    beforeEach(() => {
      process.env.HEROKU_POSTGRESQL_HOST = 'foo.herokuapp.com'
    })
    afterEach(() => delete process.env.HEROKU_POSTGRESQL_HOST)

    it('shows dev host', () => {
      expect(host({plan: {name: 'heroku-postgresql:hobby-dev'}})).to.equal('https://postgres-starter-api.heroku.com')
    })

    it('shows shogun host', () => {
      expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://foo.herokuapp.com')
    })
  })

  context('with HEROKU_POSTGRESQL_ESSENTIAL_HOST set', () => {
    beforeEach(() => {
      process.env.HEROKU_POSTGRESQL_ESSENTIAL_HOST = 'bar.herokuapp.com'
    })
    afterEach(() => delete process.env.HEROKU_POSTGRESQL_ESSENTIAL_HOST)

    it('shows dev host', () => {
      expect(host({plan: {name: 'heroku-postgresql:hobby-dev'}})).to.equal('https://bar.herokuapp.com')
    })

    it('shows shogun host', () => {
      expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://postgres-api.heroku.com')
    })
  })
})
