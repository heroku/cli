import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd, {generateCacheHitQuery} from '../../../../src/commands/pg/cache-hit.js'

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

describe('pg:cache-hit', function () {
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

  describe('generateCacheHitQuery', function () {
    it('generates the exact expected SQL query', function () {
      const expectedQuery = `SELECT
  'index hit rate' AS name,
  (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read),0) AS ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT
 'table hit rate' AS name,
  sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read),0) AS ratio
FROM pg_statio_user_tables;`

      expect(generateCacheHitQuery()).to.equal(expectedQuery)
    })

    it('uses safe division for null handling', function () {
      const query = generateCacheHitQuery()
      expect(query).to.contain('nullif(')
      expect(query).to.contain('sum(idx_blks_hit + idx_blks_read)')
      expect(query).to.contain('sum(heap_blks_hit) + sum(heap_blks_read)')
    })
  })

  describe('command behavior', function () {
    it('displays cache hit rate information', async function () {
      const mockOutput = `name            | ratio
----------------|-------
index hit rate  | 0.95
table hit rate  | 0.87`
      execQueryStub.resolves(mockOutput)

      const {stderr, stdout} = await runCommand(Cmd, ['--app', 'my-app'])

      expect(getDatabaseStub.calledOnceWith('my-app')).to.be.true
      expect(execQueryStub.calledOnceWith(generateCacheHitQuery())).to.be.true
      expect(stdout).to.contain(mockOutput)
      expect(stderr).to.eq('')
    })

    it('resolves the named database when provided', async function () {
      execQueryStub.resolves('')
      await runCommand(Cmd, ['custom-db', '--app', 'my-app'])
      expect(getDatabaseStub.calledOnceWith('my-app', 'custom-db')).to.be.true
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
