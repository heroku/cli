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
    return Promise.resolve('')
  }
}

const cmd = proxyquire('../../commands/ps', {
  '../lib/fetcher': fetcher,
  '../lib/psql': psql
})

describe('pg:ps', () => {
  let api

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  it('runs query', () => {
    return cmd.run({ app: 'myapp', args: {}, flags: {} })
      .then(() => expect(formatQuery(psql._query)).to.equal(formatQuery(`SELECT
  pid,
  state,
  application_name AS source,
  usename AS username,
  age(now(),xact_start) AS running_for,
  xact_start AS transaction_start,
  wait_event IS NOT NULL AS waiting,
  query
FROM pg_stat_activity
WHERE
  query <> '<insufficient privilege>'
  AND state <> 'idle'
  AND pid <> pg_backend_pid()
  ORDER BY query_start DESC`)))
  })

  it('runs verbose query', () => {
    return cmd.run({ app: 'myapp', args: {}, flags: { verbose: true } })
      .then(() => expect(formatQuery(psql._query)).to.equal(formatQuery(`SELECT
  pid,
  state,
  application_name AS source,
  usename AS username,
  age(now(),xact_start) AS running_for,
  xact_start AS transaction_start,
  wait_event IS NOT NULL AS waiting,
  query
FROM pg_stat_activity
WHERE
  query <> '<insufficient privilege>'
  AND pid <> pg_backend_pid()
  ORDER BY query_start DESC`)))
  })
})

function formatQuery (query) {
  return query.split('\n').map(str => str.trim()).filter(str => str.length > 0).join('\n')
}
