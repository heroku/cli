'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
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

const EXPECTED_OUTPUT_TEXT = 'slow things'

const psql = {
  serverVersion: '11.16',
  fetchVersion: function () {
    this._fetchVersionCalled = true
    return Promise.resolve(this.serverVersion)
  },
  exec: function (db, query) {
    this._query = query
    return Promise.resolve(EXPECTED_OUTPUT_TEXT)
  },
}

const cmd = proxyquire('../../../commands/outliers', {
  '../lib/fetcher': fetcher,
  '../lib/psql': psql,
})

describe('pg:outliers', () => {
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

  it('reset queries stats', async () => {
    await cmd.run({app: 'myapp', args: {}, flags: {reset: true}})

    expect(psql._query.trim()).to.equal('SELECT pg_stat_statements_reset()')
  })

  it('returns queries outliers', async () => {
    psql.serverVersion = '11.16'
    await cmd.run({app: 'myapp', args: {}, flags: {}})

    expect(psql._fetchVersionCalled).to.eq(true)
    expect(psql._query.trim()).to.contain('total_time AS total_exec_time')
    expect(psql._query.trim()).to.contain('FROM pg_stat_statements')
    expect(stdout.output).to.equal(EXPECTED_OUTPUT_TEXT)
  })

  it('uses an updated query for a newer version', async () => {
    psql.serverVersion = '13.7'
    await cmd.run({app: 'myapp', args: {}, flags: {}})
    expect(psql._fetchVersionCalled).to.eq(true)
    expect(psql._query.trim()).to.contain('total_exec_time AS total_exec_time')
    expect(psql._query.trim()).to.contain('FROM pg_stat_statements')
    expect(stdout.output).to.equal(EXPECTED_OUTPUT_TEXT)
  })
})
