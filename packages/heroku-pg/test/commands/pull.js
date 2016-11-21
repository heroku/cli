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
  host: 'herokai.com',
  attachment: {
    addon: {
      name: 'postgres-1'
    },
    config_vars: ['DATABASE_URL'],
    app: {name: 'myapp'}
  }
}

const fetcher = () => ({
  database: () => db
})
const push = proxyquire('../../commands/pull', {
  '../lib/fetcher': fetcher
})[0]

const pull = proxyquire('../../commands/pull', {
  '../lib/fetcher': fetcher
})[1]

describe('pg', () => {
  beforeEach(() => {
    cli.mockConsole()
  })

  describe('push', () => {
    it('pushes out a db', sinon.test(() => {
      let psql = require('../../lib/psql')
      sinon.stub(psql, 'exec').returns(Promise.resolve(' empty \n-------\n t'))
      let cp = sinon.mock(require('child_process'))
      cp.expects('execSync').withExactArgs('env PGSSLMODE=prefer pg_dump --verbose -F c -Z 0  -h localhost -p 5432  localdb | env PGPASSWORD="pass" pg_restore --verbose --no-acl --no-owner -U jeff -h herokai.com -p 5432 -d mydb', {stdio: 'inherit'}).once()
      return push.run({args: {source: 'localdb', target: 'postgres-1'}})
      .then(() => cp.verify())
      .then(() => expect(cli.stdout, 'to equal', 'heroku-cli: Pushing localdb ---> postgres-1\nheroku-cli: Pushing complete.\n'))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => psql.exec.restore())
    }))
  })

  describe('pull', () => {
    it('pulls a db in', sinon.test(() => {
      let psql = require('../../lib/psql')
      sinon.stub(psql, 'exec')
      let cp = sinon.mock(require('child_process'))
      cp.expects('execSync').withExactArgs('createdb  -h localhost -p 5432  localdb', {stdio: 'inherit'}).once()
      cp.expects('execSync').withExactArgs('env PGPASSWORD="pass" PGSSLMODE=prefer pg_dump --verbose -F c -Z 0 -U jeff -h herokai.com -p 5432  mydb | env pg_restore --verbose --no-acl --no-owner  -h localhost -p 5432 -d localdb', {stdio: 'inherit'}).once()
      return pull.run({args: {source: 'postgres-1', target: 'localdb'}})
      .then(() => cp.verify())
      .then(() => expect(cli.stdout, 'to equal', 'heroku-cli: Pulling postgres-1 ---> localdb\nheroku-cli: Pulling complete.\n'))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => psql.exec.restore())
    }))
  })
})
