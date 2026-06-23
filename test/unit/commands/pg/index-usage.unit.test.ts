import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd, {generateIndexUsageQuery} from '../../../../src/commands/pg/index-usage.js'

const mockDb = {
  attachment: {
    addon: {
      plan: {name: 'heroku-postgresql:premium-0'},
    },
    name: 'DATABASE',
  },
  database: 'testdb',
  host: 'localhost',
  password: 'testpass',
  pathname: '/testdb',
  port: '5432',
  url: 'postgres://localhost:5432/testdb',
  user: 'testuser',
} as unknown as pg.ConnectionDetails

describe('pg:index-usage', function () {
  let sandbox: sinon.SinonSandbox
  let getDatabaseStub: sinon.SinonStub
  let execQueryStub: sinon.SinonStub

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    getDatabaseStub = sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockDb)
    execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery')
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('generateIndexUsageQuery', function () {
    it('generates the exact expected SQL query', function () {
      const expectedQuery = `SELECT relname,
   CASE idx_scan
     WHEN 0 THEN 'Insufficient data'
     ELSE (100 * idx_scan / (seq_scan + idx_scan))::text
   END percent_of_times_index_used,
   n_live_tup rows_in_table
 FROM
   pg_stat_user_tables
 ORDER BY
   n_live_tup DESC;`

      expect(generateIndexUsageQuery()).to.equal(expectedQuery)
    })

    it('calculates index usage percentage and orders by table size', function () {
      const query = generateIndexUsageQuery()
      expect(query).to.contain('100 * idx_scan / (seq_scan + idx_scan)')
      expect(query).to.contain('CASE idx_scan')
      expect(query).to.contain('Insufficient data')
      expect(query).to.contain('n_live_tup DESC')
    })
  })

  describe('command behavior', function () {
    it('displays index usage statistics', async function () {
      const mockOutput = `relname | percent_of_times_index_used | rows_in_table
---------|------------------------------|---------------
users    | 95                          | 10000`
      execQueryStub.resolves(mockOutput)

      const {stderr, stdout} = await runCommand(Cmd, ['--app', 'my-app'])

      expect(getDatabaseStub.calledOnceWith('my-app')).to.be.true
      expect(execQueryStub.calledOnceWith(generateIndexUsageQuery())).to.be.true
      expect(stdout).to.contain(mockOutput)
      expect(stderr).to.eq('')
    })
  })

  describe('error handling', function () {
    it('surfaces database connection failures', async function () {
      getDatabaseStub.rejects(new Error('Database connection failed'))
      const {error} = await runCommand(Cmd, ['--app', 'my-app'])
      expect(error?.message).to.contain('Database connection failed')
    })

    it('surfaces SQL execution failures', async function () {
      execQueryStub.rejects(new Error('SQL execution failed'))
      const {error} = await runCommand(Cmd, ['--app', 'my-app'])
      expect(error?.message).to.contain('SQL execution failed')
    })
  })
})
