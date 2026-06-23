import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import {
  createSandbox, SinonSandbox, SinonStub,
} from 'sinon'

import Cmd, {generateUnusedIndexesQuery} from '../../../../src/commands/pg/unused-indexes.js'

describe('pg:unused-indexes', function () {
  let sandbox: SinonSandbox
  let getDatabaseStub: SinonStub
  let execQueryStub: SinonStub
  const expectedOutput = 'table | index | index_size | index_scans\n---+---\npublic.users | idx_users_email | 2.1 MB | 12'

  const mockDb: pg.ConnectionDetails = {
    database: 'testdb',
    host: 'localhost',
    password: 'testpass',
    pathname: '/testdb',
    port: '5432',
    url: 'postgres://localhost:5432/testdb',
    user: 'testuser',
  }

  beforeEach(function () {
    sandbox = createSandbox()
    getDatabaseStub = sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockDb)
    execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery').resolves(expectedOutput)
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('generateUnusedIndexesQuery', function () {
    it('generates SQL with idx_scan < 50 filter', function () {
      const query = generateUnusedIndexesQuery()
      expect(query).to.contain('idx_scan < 50')
    })

    it('generates SQL with NOT indisunique filter', function () {
      const query = generateUnusedIndexesQuery()
      expect(query).to.contain('NOT indisunique')
    })

    it('generates SQL with pg_relation_size filter', function () {
      const query = generateUnusedIndexesQuery()
      expect(query).to.contain('pg_relation_size(relid) > 5 * 8192')
    })

    it('generates SQL with correct ORDER BY clause', function () {
      const query = generateUnusedIndexesQuery()
      expect(query).to.contain('ORDER BY pg_relation_size(i.indexrelid) / nullif(idx_scan, 0) DESC NULLS FIRST')
    })

    it('generates the exact expected SQL query', function () {
      const expectedQuery = `SELECT
  schemaname || '.' || relname AS table,
  indexrelname AS index,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
  idx_scan as index_scans
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
WHERE NOT indisunique AND idx_scan < 50 AND pg_relation_size(relid) > 5 * 8192
ORDER BY pg_relation_size(i.indexrelid) / nullif(idx_scan, 0) DESC NULLS FIRST,
pg_relation_size(i.indexrelid) DESC;`

      expect(generateUnusedIndexesQuery()).to.equal(expectedQuery)
    })
  })

  describe('command behavior', function () {
    it('displays unused and almost unused indexes', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])

      expect(getDatabaseStub.calledOnceWith('myapp')).to.be.true
      expect(execQueryStub.calledOnce).to.be.true
      expect(execQueryStub.getCall(0).args[0]).to.eq(generateUnusedIndexesQuery())
      expect(stdout).to.contain(expectedOutput)
      expect(stderr).to.eq('')
    })

    it('accepts a database argument', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'postgres-123',
      ])

      expect(getDatabaseStub.calledOnce).to.be.true
      expect(getDatabaseStub.getCall(0).args[1]).to.eq('postgres-123')
    })
  })

  describe('error handling', function () {
    it('surfaces database connection failures', async function () {
      getDatabaseStub.rejects(new Error('Database connection failed'))
      const {error} = await runCommand(Cmd, ['--app', 'myapp'])
      expect(error?.message).to.contain('Database connection failed')
    })

    it('surfaces SQL execution failures', async function () {
      execQueryStub.rejects(new Error('SQL execution failed'))
      const {error} = await runCommand(Cmd, ['--app', 'myapp'])
      expect(error?.message).to.contain('SQL execution failed')
    })
  })
})
