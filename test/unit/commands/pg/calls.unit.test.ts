import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd, {generateCallsQuery} from '../../../../src/commands/pg/calls.js'

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

describe('pg:calls', function () {
  let sandbox: sinon.SinonSandbox
  let getDatabaseStub: sinon.SinonStub
  let execQueryStub: sinon.SinonStub

  // Drives the helper queries in generateCallsQuery:
  //   call 0: ensurePGStatStatement -> availability ('t')
  //   call 1: newTotalExecTimeField -> server_version_num >= 130000
  //   call 2: newBlkTimeFields      -> server_version_num >= 170000
  function setupHelperStubs({newBlkTime, newTotalExecTime}: {newBlkTime: boolean; newTotalExecTime: boolean}) {
    execQueryStub.onCall(0).resolves('t')
    execQueryStub.onCall(1).resolves(newTotalExecTime ? 't' : 'f')
    execQueryStub.onCall(2).resolves(newBlkTime ? 't' : 'f')
  }

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    getDatabaseStub = sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockDb)
    execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery')
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('generateCallsQuery', function () {
    it('generates the expected SQL for PostgreSQL 13+/17+ with truncate', async function () {
      setupHelperStubs({newBlkTime: true, newTotalExecTime: true})

      const expectedQuery = `SELECT interval '1 millisecond' * total_exec_time AS total_exec_time,
to_char((total_exec_time/sum(total_exec_time) OVER()) * 100, 'FM90D0') || '%'  AS prop_exec_time,
to_char(calls, 'FM999G999G999G990') AS ncalls,
interval '1 millisecond' * (shared_blk_read_time + shared_blk_write_time) AS sync_io_time,
CASE WHEN length(query) <= 40 THEN query ELSE substr(query, 0, 39) || '…' END AS query
FROM pg_stat_statements WHERE userid = (SELECT usesysid FROM pg_user WHERE usename = current_user LIMIT 1)
ORDER BY calls DESC
LIMIT 10`

      const actual = await generateCallsQuery(mockDb, {truncate: true})
      expect(actual).to.equal(expectedQuery)
    })

    it('generates the expected SQL for PostgreSQL 13+/17+ without truncate', async function () {
      setupHelperStubs({newBlkTime: true, newTotalExecTime: true})

      const expectedQuery = `SELECT interval '1 millisecond' * total_exec_time AS total_exec_time,
to_char((total_exec_time/sum(total_exec_time) OVER()) * 100, 'FM90D0') || '%'  AS prop_exec_time,
to_char(calls, 'FM999G999G999G990') AS ncalls,
interval '1 millisecond' * (shared_blk_read_time + shared_blk_write_time) AS sync_io_time,
query AS query
FROM pg_stat_statements WHERE userid = (SELECT usesysid FROM pg_user WHERE usename = current_user LIMIT 1)
ORDER BY calls DESC
LIMIT 10`

      const actual = await generateCallsQuery(mockDb, {truncate: false})
      expect(actual).to.equal(expectedQuery)
    })

    it('generates the expected SQL for older PostgreSQL versions', async function () {
      setupHelperStubs({newBlkTime: false, newTotalExecTime: false})

      const expectedQuery = `SELECT interval '1 millisecond' * total_time AS total_exec_time,
to_char((total_time/sum(total_time) OVER()) * 100, 'FM90D0') || '%'  AS prop_exec_time,
to_char(calls, 'FM999G999G999G990') AS ncalls,
interval '1 millisecond' * (blk_read_time + blk_write_time) AS sync_io_time,
CASE WHEN length(query) <= 40 THEN query ELSE substr(query, 0, 39) || '…' END AS query
FROM pg_stat_statements WHERE userid = (SELECT usesysid FROM pg_user WHERE usename = current_user LIMIT 1)
ORDER BY calls DESC
LIMIT 10`

      const actual = await generateCallsQuery(mockDb, {truncate: true})
      expect(actual).to.equal(expectedQuery)
    })

    it('handles the truncate flag correctly', async function () {
      setupHelperStubs({newBlkTime: true, newTotalExecTime: true})
      const truncated = await generateCallsQuery(mockDb, {truncate: true})
      expect(truncated).to.contain('CASE WHEN length(query) <= 40')

      sandbox.restore()
      sandbox = sinon.createSandbox()
      sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockDb)
      execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery')
      setupHelperStubs({newBlkTime: true, newTotalExecTime: true})
      const full = await generateCallsQuery(mockDb, {truncate: false})
      expect(full).to.contain('query AS query')
      expect(full).not.to.contain('CASE WHEN length(query)')
    })
  })

  describe('command behavior', function () {
    it('displays database calls information', async function () {
      const mockOutput = `query | exec_time | prop_exec_time | ncalls | sync_io_time
------|-----------|----------------|--------|-------------
SELECT * FROM users | 1.23 | 0.15 | 100 | 0.05`
      setupHelperStubs({newBlkTime: true, newTotalExecTime: true})
      execQueryStub.onCall(3).resolves(mockOutput)

      const {stderr, stdout} = await runCommand(Cmd, ['--app', 'my-app'])

      expect(getDatabaseStub.calledOnceWith('my-app')).to.be.true
      expect(stdout).to.contain(mockOutput)
      expect(stderr).to.eq('')
    })

    it('passes the truncate flag through to the query', async function () {
      setupHelperStubs({newBlkTime: true, newTotalExecTime: true})
      execQueryStub.onCall(3).resolves('out')

      await runCommand(Cmd, ['--app', 'my-app', '--truncate'])

      expect(execQueryStub.getCall(3).args[0]).to.contain('CASE WHEN length(query) <= 40')
    })
  })

  describe('error handling', function () {
    it('surfaces database connection failures', async function () {
      getDatabaseStub.rejects(new Error('Database connection failed'))
      const {error} = await runCommand(Cmd, ['--app', 'my-app'])
      expect(error?.message).to.contain('Database connection failed')
    })

    it('errors when pg_stat_statements is not available', async function () {
      // ensurePGStatStatement raises the "need to be installed" error inside its own
      // try/catch, which then re-raises the generic availability-check failure.
      execQueryStub.onCall(0).resolves('f')

      const {error} = await runCommand(Cmd, ['--app', 'my-app'])

      expect(error?.message).to.contain('Failed to check pg_stat_statements extension availability')
    })
  })
})
