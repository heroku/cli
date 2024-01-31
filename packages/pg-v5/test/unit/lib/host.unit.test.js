'use strict'
/* global context beforeEach afterEach */

const {expect} = require('chai')
let host = require('../../../lib/host')

describe('host', () => {
  it('shows dev host', () => {
    expect(host({plan: {name: 'heroku-postgresql:mini'}})).to.equal('https://postgres-starter-api.heroku.com')
  })

  it('shows prod host', () => {
    expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://postgres-api.heroku.com')
  })

  context('for numbered essential plans', () => {
    it('shows data host', () => {
      expect(host({plan: {name: 'heroku-postgresql:essential-0'}})).to.equal('https://postgres-api.heroku.com')
    })
  })

  context('with HEROKU_DATA_HOST set', () => {
    beforeEach(() => {
      process.env.HEROKU_DATA_HOST = 'data-host.herokuapp.com'
      process.env.HEROKU_POSTGRESQL_HOST = 'postgresql-host.herokuapp.com'
    })
    afterEach(() => delete process.env.HEROKU_DATA_HOST)
    afterEach(() => delete process.env.HEROKU_POSTGRESQL_HOST)

    it('shows essential host', () => {
      expect(host({plan: {name: 'heroku-postgresql:mini'}})).to.equal('https://postgres-starter-api.heroku.com')
    })

    it('shows data host', () => {
      expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://data-host.herokuapp.com')
    })

    context('for numbered essential plans', () => {
      it('shows data host', () => {
        expect(host({plan: {name: 'heroku-postgresql:essential-0'}})).to.equal('https://data-host.herokuapp.com')
      })
    })
  })

  context('with HEROKU_POSTGRESQL_HOST set', () => {
    beforeEach(() => {
      process.env.HEROKU_POSTGRESQL_HOST = 'postgresql-host.herokuapp.com'
    })
    afterEach(() => delete process.env.HEROKU_POSTGRESQL_HOST)

    it('shows essential host', () => {
      expect(host({plan: {name: 'heroku-postgresql:mini'}})).to.equal('https://postgres-starter-api.heroku.com')
    })

    it('shows postgresql host', () => {
      expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://postgresql-host.herokuapp.com')
    })

    context('for numbered essential plans', () => {
      it('shows data host', () => {
        expect(host({plan: {name: 'heroku-postgresql:essential-0'}})).to.equal('https://postgresql-host.herokuapp.com')
      })
    })
  })

  context('with HEROKU_POSTGRESQL_ESSENTIAL_HOST set', () => {
    beforeEach(() => {
      process.env.HEROKU_POSTGRESQL_ESSENTIAL_HOST = 'essential-host.herokuapp.com'
    })
    afterEach(() => delete process.env.HEROKU_POSTGRESQL_ESSENTIAL_HOST)

    it('shows essential host', () => {
      expect(host({plan: {name: 'heroku-postgresql:mini'}})).to.equal('https://essential-host.herokuapp.com')
    })

    it('shows prod host', () => {
      expect(host({plan: {name: 'heroku-postgresql:premium-0'}})).to.equal('https://postgres-api.heroku.com')
    })

    context('for numbered essential plans', () => {
      it('shows prod host', () => {
        expect(host({plan: {name: 'heroku-postgresql:essential-0'}})).to.equal('https://postgres-api.heroku.com')
      })
    })
  })
})
