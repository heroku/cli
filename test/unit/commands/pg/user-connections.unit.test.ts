import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import {
  createSandbox, SinonSandbox, SinonStub,
} from 'sinon'

import Cmd, {generateUserConnectionsQuery} from '../../../../src/commands/pg/user-connections.js'

describe('pg:user-connections', function () {
  let sandbox: SinonSandbox
  let getDatabaseStub: SinonStub
  let execQueryStub: SinonStub
  const expectedOutput = 'credential | connections\n---+---\npostgres | 5'

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

  describe('generateUserConnectionsQuery', function () {
    it('generates SQL with the expected clauses', function () {
      const query = generateUserConnectionsQuery()
      expect(query).to.contain('WHERE state = \'active\'')
      expect(query).to.contain('GROUP BY usename')
      expect(query).to.contain('ORDER BY connections DESC')
      expect(query).to.contain('count(*) AS connections')
    })

    it('generates the exact expected SQL query', function () {
      const expectedQuery = `SELECT
  usename AS credential,
  count(*) AS connections
FROM pg_stat_activity
WHERE state = 'active'
GROUP BY usename
ORDER BY connections DESC;`

      expect(generateUserConnectionsQuery()).to.equal(expectedQuery)
    })
  })

  describe('command behavior', function () {
    it('displays the number of connections per credential', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])

      expect(getDatabaseStub.calledOnceWith('myapp')).to.be.true
      expect(execQueryStub.calledOnce).to.be.true
      expect(execQueryStub.getCall(0).args[0]).to.eq(generateUserConnectionsQuery())
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
