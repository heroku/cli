'use strict'
/* global beforeEach */

const cli = require('heroku-cli-util')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const {expect} = require('chai')

const db = {
  user: 'jeff',
  password: 'pass',
  database: 'mydb',
  port: 5432,
  host: 'localhost',
  attachment: {
    addon: {
      name: 'postgres-1',
    },
    config_vars: ['DATABASE_URL'],
    app: {name: 'myapp'},
  },
}

const fetcher = () => ({
  database: () => db,
})
const cmd = proxyquire('../../../commands/psql', {
  '../lib/fetcher': fetcher,
})[0]

describe('psql', () => {
  beforeEach(() => {
    cli.mockConsole()
  })

  it('runs psql', () => {
    let psql = require('../../../lib/psql')
    sinon.stub(psql, 'exec').returns(Promise.resolve(''))
    return cmd.run({args: {}, flags: {command: 'SELECT 1'}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('--> Connecting to postgres-1\n'))
      .then(() => psql.exec.restore())
  })

  it('runs psql with file', () => {
    let psql = require('../../../lib/psql')
    sinon.stub(psql, 'execFile').returns(Promise.resolve(''))
    return cmd.run({args: {}, flags: {file: 'test.sql'}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('--> Connecting to postgres-1\n'))
      .then(() => psql.execFile.restore())
  })
})
