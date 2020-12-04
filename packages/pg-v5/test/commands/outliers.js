'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const { expect } = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const db = {}
const fetcher = () => {
  return {
    database: () => db
  }
}

const psql = {
  exec: function (db, query) {
    this._query = query
    return Promise.resolve('t')
  }
}

const cmd = proxyquire('../../commands/outliers', {
  '../lib/fetcher': fetcher,
  '../lib/psql': psql
})

describe('pg:outliers', () => {
  let api

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  it('reset queries stats', () => {
    return cmd.run({ app: 'myapp', args: {}, flags: { reset: true } })
      .then(() => expect(psql._query.trim()).to.equal('SELECT pg_stat_statements_reset()'))
  })

  it('returns queries outliers', () => {
    return cmd.run({ app: 'myapp', args: {}, flags: {} })
      .then(() => expect(psql._query.trim()).to.contain('FROM pg_stat_statements'))
  })
})
