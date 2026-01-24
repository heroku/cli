import {stdout} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import Cmd from '../../../../src/commands/pg/locks.js'
import * as sinon from 'sinon'
import {pg, utils} from '@heroku/heroku-cli-util'

describe('pg:locks', function () {
  let sandbox: sinon.SinonSandbox
  let getDatabaseStub: sinon.SinonStub
  let execQueryStub: sinon.SinonStub
  const expectedOutput = 'pid | relname | transactionid | granted | query_snippet | age\n---+---\n100 | users | 123 | t | SELECT * FROM... | 00:01:00'

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
    execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery').resolves(expectedOutput)
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('displays queries with active locks', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(getDatabaseStub.calledOnce).to.be.true
    expect(execQueryStub.calledOnce).to.be.true
    const query = execQueryStub.getCall(0).args[0]
    expect(query).to.contain('pg_stat_activity')
    expect(query).to.contain('pg_locks')
    expect(query).to.contain("pg_locks.mode = 'ExclusiveLock'")
    expect(stdout.output.trim()).to.eq(expectedOutput)
  })

  it('includes full query without truncation by default', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    const query = execQueryStub.getCall(0).args[0]
    expect(query).to.contain('pg_stat_activity.query')
    expect(query).not.to.contain('substr(')
  })

  it('truncates queries with --truncate flag', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--truncate',
    ])

    expect(execQueryStub.calledOnce).to.be.true
    const query = execQueryStub.getCall(0).args[0]
    expect(query).to.contain('CASE WHEN length(pg_stat_activity.query) <= 40')
    expect(query).to.contain("substr(pg_stat_activity.query, 0, 39) || '…'")
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
