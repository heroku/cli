'use strict'
/* global beforeEach afterEach */

const cli = require('@heroku/heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')
const {stdout} = require('stdout-stderr')

const db = {}
const fetcher = () => {
  return {
    database: () => db,
  }
}

const FAKE_OUTPUT_TEXT = removeEmptyLines(`
pid  | state  | source  | username | running_for | transaction_start | waiting | query
-------+--------+---------+----------+-------------+-------------------+---------+-------
 17496 | active | standby | postgres |             |                   | t       |
(1 row)

`)

const psql = {
  exec: function (db, query) {
    this._query = query
    return Promise.resolve(FAKE_OUTPUT_TEXT)
  },
}

const cmd = proxyquire('../../../commands/ps', {
  '../lib/fetcher': fetcher,
  '../lib/psql': psql,
})

describe('pg:ps', () => {
  let api

  beforeEach(() => {
    stdout.start()
    api = nock('https://api.heroku.com:443')
    cli.mockConsole()
  })

  afterEach(() => {
    stdout.stop()
    nock.cleanAll()
    api.done()
  })

  it('runs query', async () => {
    await cmd.run({app: 'myapp', args: {}, flags: {}})
    expect(removeEmptyLines(psql._query)).to.equal(removeEmptyLines(`SELECT
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
 ORDER BY query_start DESC`))

    expect(removeEmptyLines(stdout.output)).to.equal(FAKE_OUTPUT_TEXT)
  })

  it('runs verbose query', async () => {
    await cmd.run({app: 'myapp', args: {}, flags: {verbose: true}})
    expect(removeEmptyLines(psql._query)).to.equal(removeEmptyLines(`SELECT
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
 ORDER BY query_start DESC`))

    expect(removeEmptyLines(stdout.output)).to.equal(FAKE_OUTPUT_TEXT)
  })
})

function removeEmptyLines(string) {
  return string.toString().split('\n').map(str => str.trim()).filter(str => str.length > 0).join('\n')
}
