import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/pg/outliers.js'

describe('pg:outliers', function () {
  let sandbox: sinon.SinonSandbox
  let execQueryStub: sinon.SinonStub
  const expectedOutputText = 'slow things'

  const mockEssentialDb = {
    attachment: {
      addon: {
        id: 'addon-id',
        name: 'postgres-addon-name',
        plan: {
          id: 'essential-0-plan-id',
          name: 'heroku-postgresql:essential-0',
        },
      },
      app: {
        id: 'myapp-id',
        name: 'myapp',
      },
      config_vars: ['DATABASE_URL'],
      id: 'database-attachment-id',
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

  const mockStandardDb = {
    ...mockEssentialDb,
    attachment: {
      ...mockEssentialDb.attachment,
      addon: {
        ...mockEssentialDb.attachment!.addon,
        plan: {
          id: 'standard-0-plan-id',
          name: 'heroku-postgresql:standard-0',
        },
      },
    },
  } as unknown as pg.ConnectionDetails

  const mockAdvancedDb = {
    ...mockEssentialDb,
    attachment: {
      ...mockEssentialDb.attachment,
      addon: {
        ...mockEssentialDb.attachment!.addon,
        plan: {
          id: 'advanced-plan-id',
          name: 'heroku-postgresql:advanced',
        },
      },
    },
  } as unknown as pg.ConnectionDetails

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery')
  })

  afterEach(function () {
    sandbox.restore()
  })

  // Helper to set up stubs for a specific version
  // Call order: 1) fetchVersion (SHOW server_version), 2) ensurePGStatStatement, 3) main query
  function setupVersionStub(version: string) {
    execQueryStub.onCall(0).resolves(`server_version\n---------\n${version}`) // fetchVersion
    execQueryStub.onCall(1).resolves('public\n') // ensurePGStatStatement returns the schema
    execQueryStub.onCall(2).resolves(expectedOutputText) // main query
  }

  it('resets query stats on standard plan using real function', async function () {
    sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockStandardDb)
    execQueryStub.onCall(0).resolves('server_version\n---------\n13.7')
    execQueryStub.onCall(1).resolves('public\n')
    execQueryStub.onCall(2).resolves('')

    await runCommand(Cmd, ['--app', 'myapp', '--reset'])

    expect(execQueryStub.calledThrice).to.be.true
    const resetQuery = execQueryStub.getCall(2).args[0]
    expect(resetQuery.trim()).to.eq('SELECT public.pg_stat_statements_reset();')
  })

  it('resets query stats on standard plan using the detected custom schema', async function () {
    // ensurePGStatStatement can detect a non-default schema; the Standard-tier reset path
    // must interpolate that detected schema rather than hardcoding 'public'.
    sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockStandardDb)
    execQueryStub.onCall(0).resolves('server_version\n---------\n13.7')
    execQueryStub.onCall(1).resolves('stats\n')
    execQueryStub.onCall(2).resolves('')

    await runCommand(Cmd, ['--app', 'myapp', '--reset'])

    expect(execQueryStub.calledThrice).to.be.true
    const resetQuery = execQueryStub.getCall(2).args[0]
    expect(resetQuery.trim()).to.eq('SELECT stats.pg_stat_statements_reset();')
  })

  it('resets query stats on essential plan using _heroku wrapper', async function () {
    sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockEssentialDb)
    execQueryStub.onCall(0).resolves('server_version\n---------\n17.7')
    execQueryStub.onCall(1).resolves('heroku_ext\n')
    execQueryStub.onCall(2).resolves('')

    await runCommand(Cmd, ['--app', 'myapp', '--reset'])

    expect(execQueryStub.calledThrice).to.be.true
    const resetQuery = execQueryStub.getCall(2).args[0]
    expect(resetQuery.trim()).to.eq('SELECT _heroku.pg_stat_statements_reset();')
  })

  it('resets query stats on advanced plan using _heroku wrapper', async function () {
    sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockAdvancedDb)
    execQueryStub.onCall(0).resolves('server_version\n---------\n17.7')
    execQueryStub.onCall(1).resolves('heroku_ext\n')
    execQueryStub.onCall(2).resolves('')

    await runCommand(Cmd, ['--app', 'myapp', '--reset'])

    expect(execQueryStub.calledThrice).to.be.true
    const resetQuery = execQueryStub.getCall(2).args[0]
    expect(resetQuery.trim()).to.eq('SELECT _heroku.pg_stat_statements_reset();')
  })

  it('returns query outliers for version 11', async function () {
    sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockEssentialDb)
    setupVersionStub('11.16')

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(execQueryStub.calledThrice).to.be.true
    // The third call is the outliers query
    const query = execQueryStub.getCall(2).args[0]
    expect(query).to.contain('total_time AS total_exec_time')
    expect(query).to.contain('FROM public.pg_stat_statements')
    expect(stdout.trim()).to.eq(expectedOutputText)
  })

  it('uses an updated query for version 13+', async function () {
    sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockEssentialDb)
    setupVersionStub('13.7')

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(execQueryStub.calledThrice).to.be.true
    const query = execQueryStub.getCall(2).args[0]
    expect(query).to.contain('total_exec_time AS total_exec_time')
    expect(query).to.contain('FROM public.pg_stat_statements')
    expect(stdout.trim()).to.eq(expectedOutputText)
  })

  it('uses updated block time fields for version 17+', async function () {
    sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockEssentialDb)
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
    sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockEssentialDb)
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
    sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockEssentialDb)
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

  it('uses the detected custom schema in the main query', async function () {
    // ensurePGStatStatement can detect a non-default schema; the main query must
    // interpolate that detected schema rather than hardcoding 'public'.
    sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockEssentialDb)
    execQueryStub.onCall(0).resolves('server_version\n---------\n13.7')
    execQueryStub.onCall(1).resolves('stats\n')
    execQueryStub.onCall(2).resolves(expectedOutputText)

    await runCommand(Cmd, ['--app', 'myapp'])

    expect(execQueryStub.calledThrice).to.be.true
    const query = execQueryStub.getCall(2).args[0]
    expect(query).to.contain('FROM stats.pg_stat_statements')
  })

  it('errors when pg_stat_statements is not installed', async function () {
    // ensurePGStatStatement surfaces its real "need to be installed" error directly;
    // the helpful install instructions propagate to the user instead of being swallowed.
    sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockEssentialDb)
    execQueryStub.onCall(0).resolves('server_version\n---------\n13.7') // fetchVersion
    execQueryStub.onCall(1).resolves('\n') // ensurePGStatStatement: empty => not installed

    const {error} = await runCommand(Cmd, ['--app', 'myapp'])

    expect(error?.message).to.contain('The pg_stat_statements extension needs to be installed first.')
  })
})
