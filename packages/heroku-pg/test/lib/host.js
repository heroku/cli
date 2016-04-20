'use strict'
/* global describe context beforeEach afterEach it */

let expect = require('unexpected')
let host = require('../../lib/host')

describe('host', () => {
  it('shows dev host', () => {
    expect(host({plan: {name: 'heroku-postgresql:hobby-dev'}}), 'to equal', 'https://postgres-starter-api.heroku.com')
  })

  it('shows prod host', () => {
    expect(host({plan: {name: 'heroku-postgresql:premium-0'}}), 'to equal', 'https://postgres-api.heroku.com')
  })

  context('with SHOGUN set', () => {
    beforeEach(() => { process.env.SHOGUN = 'shogun' })
    afterEach(() => delete process.env.SHOGUN)

    it('shows dev host', () => {
      expect(host({plan: {name: 'heroku-postgresql:hobby-dev'}}), 'to equal', 'https://postgres-starter-api.heroku.com')
    })

    it('shows shogun host', () => {
      expect(host({plan: {name: 'heroku-postgresql:premium-0'}}), 'to equal', 'https://shogun.herokuapp.com')
    })
  })

  context('with HEROKU_POSTGRESQL_HOST set', () => {
    beforeEach(() => { process.env.HEROKU_POSTGRESQL_HOST = 'foo' })
    afterEach(() => delete process.env.HEROKU_POSTGRESQL_HOST)

    it('shows dev host', () => {
      expect(host({plan: {name: 'heroku-postgresql:hobby-dev'}}), 'to equal', 'https://foo.herokuapp.com')
    })

    it('shows shogun host', () => {
      expect(host({plan: {name: 'heroku-postgresql:premium-0'}}), 'to equal', 'https://foo.herokuapp.com')
    })
  })
})
