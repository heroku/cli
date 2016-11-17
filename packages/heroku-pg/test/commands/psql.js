'use strict'

/* global describe it beforeEach */

const cli = require('heroku-cli-util')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const expect = require('unexpected')

const db = {
  user: 'jeff',
  password: 'pass',
  database: 'mydb',
  port: 5432,
  host: 'localhost',
  addon: {
    name: 'postgres-1',
    config_vars: ['DATABASE_URL'],
    app: {name: 'myapp'}
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

  it('runs psql', sinon.test(() => {
    let cp = sinon.mock(require('child_process'))
    cp.expects('spawnSync').withArgs('psql').once().returns({
      stdout: '',
      status: 0
    })
    return cmd.run({args: {}, flags: {}})
    .then(() => cp.verify())
    .then(() => expect(cli.stdout, 'to equal', ''))
    .then(() => expect(cli.stderr, 'to equal', '--> Connecting to postgres-1\n'))
  }))
})
