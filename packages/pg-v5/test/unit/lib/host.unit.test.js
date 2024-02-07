'use strict'
/* global context beforeEach afterEach */

const {expect} = require('chai')
let host = require('../../../lib/host')

describe('host', () => {
  it('shows api.data.heroku.com host', () => {
    expect(host({plan: {name: 'heroku-postgresql:mini'}})).to.equal('https://api.data.heroku.com')
    expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://api.data.heroku.com')
    expect(host({plan: {name: 'heroku-postgresql:essential-0'}})).to.equal('https://api.data.heroku.com')
  })

  context('with HEROKU_DATA_HOST set', () => {
    beforeEach(() => {
      process.env.HEROKU_DATA_HOST = 'data-host.herokuapp.com'
    })
    afterEach(() => delete process.env.HEROKU_DATA_HOST)

    it('shows data-host.herokuapp.com host', () => {
      expect(host({plan: {name: 'heroku-postgresql:mini'}})).to.equal('https://data-host.herokuapp.com')
      expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://data-host.herokuapp.com')
      expect(host({plan: {name: 'heroku-postgresql:essential-0'}})).to.equal('https://data-host.herokuapp.com')
    })
  })

  context('with HEROKU_POSTGRESQL_HOST set', () => {
    beforeEach(() => {
      process.env.HEROKU_POSTGRESQL_HOST = 'postgresql-host.herokuapp.com'
    })
    afterEach(() => delete process.env.HEROKU_POSTGRESQL_HOST)

    it('shows postgresql-host.herokuapp.com host', () => {
      expect(host({plan: {name: 'heroku-postgresql:mini'}})).to.equal('https://postgresql-host.herokuapp.com')
      expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://postgresql-host.herokuapp.com')
      expect(host({plan: {name: 'heroku-postgresql:essential-0'}})).to.equal('https://postgresql-host.herokuapp.com')
    })
  })
})
