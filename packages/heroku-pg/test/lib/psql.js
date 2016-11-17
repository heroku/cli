'use strict'

/* global describe it */

const sinon = require('sinon')
const psql = require('../../lib/psql')

const db = {
  user: 'jeff',
  password: 'pass',
  database: 'mydb',
  port: 5432,
  host: 'localhost'
}

describe('psql', () => {
  describe('exec', () => {
    it('runs psql', sinon.test(() => {
      let cp = sinon.mock(require('child_process'))
      let env = Object.assign({}, process.env, {
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'require',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: 5432,
        PGHOST: 'localhost'
      })
      let opts = {env, encoding: 'utf8', stdio: [0, 'pipe', 2]}
      cp.expects('spawnSync').withExactArgs('psql', ['--command', 'SELECT NOW();'], opts).once().returns({
        stdout: '',
        status: 0
      })
      return psql.exec(db, 'SELECT NOW();')
      .then(() => cp.verify())
    }))
  })
})
