'use strict'

/* global describe it beforeEach */

const cli = require('heroku-cli-util')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')

const db = {
  user: 'jeff',
  password: 'pass',
  database: 'mydb',
  port: 5432,
  host: 'localhost',
  attachment: {
    addon: {
      name: 'postgres-1'
    },
    config_vars: ['DATABASE_URL'],
    app: { name: 'myapp' }
  }
}

const fetcher = () => ({
  database: () => db
})
const cmd = proxyquire('../../commands/psql', {
  '../lib/fetcher': fetcher
})[0]

describe('psql', () => {
  beforeEach(() => {
    cli.mockConsole()
  })

  it('runs psql', async () => {
    let psql = require('../../lib/psql')
    sinon.stub(psql, 'exec').returns(Promise.resolve(''))

    await cmd.run({ args: {}, flags: { command: 'SELECT 1' } })

    expect(cli.stdout).to.equal('');
    expect(cli.stderr).to.equal('--> Connecting to postgres-1\n');

    return psql.exec.restore()
  })

  it('runs psql with file', async () => {
    let psql = require('../../lib/psql')
    sinon.stub(psql, 'execFile').returns(Promise.resolve(''))

    await cmd.run({ args: {}, flags: { file: 'test.sql' } })

    expect(cli.stdout).to.equal('');
    expect(cli.stderr).to.equal('--> Connecting to postgres-1\n');

    return psql.execFile.restore()
  })
})
