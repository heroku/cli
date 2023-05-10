'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const db = {}
const fetcher = () => {
  return {
    database: () => db,
  }
}

const psql = {
  exec: function (db, query) {
    this._query = query
    return Promise.resolve('')
  },
}

const cmd = proxyquire('../../commands/kill', {
  '../lib/fetcher': fetcher,
  '../lib/psql': psql,
})

describe('pg:kill', () => {
  let api

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  it('kills pid 100', () => {
    return cmd.run({app: 'myapp', args: {pid: 100}, flags: {}})
      .then(() => expect(psql._query.trim()).to.equal('SELECT pg_cancel_backend(100);'))
  })

  it('force kills pid 100', () => {
    return cmd.run({app: 'myapp', args: {pid: 100}, flags: {force: true}})
      .then(() => expect(psql._query.trim()).to.equal('SELECT pg_terminate_backend(100);'))
  })
})
