import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import {
  createSandbox, SinonSandbox, SinonStub,
} from 'sinon'

import Cmd, {generateLongRunningQueriesQuery} from '../../../../src/commands/pg/long-running-queries.js'

describe('pg:long-running-queries', function () {
  let sandbox: SinonSandbox
  let getDatabaseStub: SinonStub
  let execQueryStub: SinonStub
  const expectedOutput = 'pid | duration | query\n---+---\n100 | 00:06:00 | SELECT * FROM users'

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

  describe('generateLongRunningQueriesQuery', function () {
    it('generates the exact expected SQL query', function () {
      const expectedQuery = `SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query AS query
FROM
  pg_stat_activity
WHERE
  pg_stat_activity.query <> ''::text
  AND state <> 'idle'
  AND now() - pg_stat_activity.query_start > interval '5 minutes'
ORDER BY
  now() - pg_stat_activity.query_start DESC;`

      expect(generateLongRunningQueriesQuery()).to.equal(expectedQuery)
    })

    it('generates SQL selecting long running queries', function () {
      const query = generateLongRunningQueriesQuery()
      expect(query).to.contain('pg_stat_activity')
      expect(query).to.contain('now() - pg_stat_activity.query_start')
      expect(query).to.contain("state <> 'idle'")
      expect(query).to.contain("interval '5 minutes'")
    })
  })

  describe('command behavior', function () {
    it('displays long running queries', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])

      expect(getDatabaseStub.calledOnceWith('myapp')).to.be.true
      expect(execQueryStub.calledOnce).to.be.true
      expect(execQueryStub.getCall(0).args[0]).to.eq(generateLongRunningQueriesQuery())
      expect(stdout.trim()).to.eq(expectedOutput)
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
