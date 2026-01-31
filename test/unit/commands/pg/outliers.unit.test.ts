import {stdout} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import Cmd from '../../../../src/commands/pg/outliers.js'
import * as sinon from 'sinon'
import {pg, utils} from '@heroku/heroku-cli-util'

describe('pg:outliers', function () {
  let sandbox: sinon.SinonSandbox
  let getDatabaseStub: sinon.SinonStub
  let execQueryStub: sinon.SinonStub
  const expectedOutputText = 'slow things'

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
    sandbox = sinon.createSandbox()
    getDatabaseStub = sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockDb)
    execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery')
  })

  afterEach(function () {
    sandbox.restore()
  })

  // Helper to set up stubs for a specific version
  // Call order: 1) fetchVersion (SHOW server_version), 2) ensurePGStatStatement, 3) main query
  function setupVersionStub(version: string) {
    execQueryStub.onCall(0).resolves(`server_version\n---------\n${version}`) // fetchVersion
    execQueryStub.onCall(1).resolves('t') // ensurePGStatStatement returns 't' for available
    execQueryStub.onCall(2).resolves(expectedOutputText) // main query
  }

  it('resets query stats', async function () {
    // For reset: 1) fetchVersion, 2) ensurePGStatStatement, 3) reset
    execQueryStub.onCall(0).resolves('server_version\n---------\n13.7')
    execQueryStub.onCall(1).resolves('t')
    execQueryStub.onCall(2).resolves('')

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--reset',
    ])

    expect(getDatabaseStub.calledOnce).to.be.true
    expect(execQueryStub.calledThrice).to.be.true
    const resetQuery = execQueryStub.getCall(2).args[0]
    expect(resetQuery.trim()).to.eq('SELECT pg_stat_statements_reset();')
  })

  it('returns query outliers for version 11', async function () {
    setupVersionStub('11.16')

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(execQueryStub.calledThrice).to.be.true
    // The third call is the outliers query
    const query = execQueryStub.getCall(2).args[0]
    expect(query).to.contain('total_time AS total_exec_time')
    expect(query).to.contain('FROM pg_stat_statements')
    expect(stdout.output.trim()).to.eq(expectedOutputText)
  })

  it('uses an updated query for version 13+', async function () {
    setupVersionStub('13.7')

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(execQueryStub.calledThrice).to.be.true
    const query = execQueryStub.getCall(2).args[0]
    expect(query).to.contain('total_exec_time AS total_exec_time')
    expect(query).to.contain('FROM pg_stat_statements')
    expect(stdout.output.trim()).to.eq(expectedOutputText)
  })

  it('uses updated block time fields for version 17+', async function () {
    setupVersionStub('17.0')

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(execQueryStub.calledThrice).to.be.true
    const query = execQueryStub.getCall(2).args[0]
    expect(query).to.contain('shared_blk_read_time')
    expect(query).to.contain('shared_blk_write_time')
  })

  it('respects the --num flag', async function () {
    setupVersionStub('13.7')

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--num',
      '5',
    ])

    const query = execQueryStub.getCall(2).args[0]
    expect(query).to.contain('LIMIT 5')
  })

  it('truncates queries with --truncate flag', async function () {
    setupVersionStub('13.7')

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--truncate',
    ])

    const query = execQueryStub.getCall(2).args[0]
    expect(query).to.contain('CASE WHEN length(query) <= 40')
    expect(query).to.contain("substr(query, 0, 39) || '…'")
  })
})
