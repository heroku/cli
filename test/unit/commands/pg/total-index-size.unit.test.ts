import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import {
  createSandbox, SinonSandbox, SinonStub,
} from 'sinon'

import Cmd, {generateTotalIndexSizeQuery} from '../../../../src/commands/pg/total-index-size.js'

describe('pg:total-index-size', function () {
  let sandbox: SinonSandbox
  let getDatabaseStub: SinonStub
  let execQueryStub: SinonStub
  const expectedOutput = 'size\n---\n15.2 MB'

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

  describe('generateTotalIndexSizeQuery', function () {
    it('generates SQL with the expected clauses', function () {
      const query = generateTotalIndexSizeQuery()
      expect(query).to.contain('sum(c.relpages')
      expect(query).to.contain('pg_size_pretty')
      expect(query).to.contain("c.relkind='i'")
      expect(query).to.contain('information_schema')
    })

    it('generates the exact expected SQL query', function () {
      const expectedQuery = `SELECT pg_size_pretty(sum(c.relpages::bigint*8192)::bigint) AS size
FROM pg_class c
LEFT JOIN pg_namespace n ON (n.oid = c.relnamespace)
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
AND n.nspname !~ '^pg_toast'
AND c.relkind='i';`

      expect(generateTotalIndexSizeQuery()).to.equal(expectedQuery)
    })
  })

  describe('command behavior', function () {
    it('displays the total size of all indexes', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])

      expect(getDatabaseStub.calledOnceWith('myapp')).to.be.true
      expect(execQueryStub.calledOnce).to.be.true
      expect(execQueryStub.getCall(0).args[0]).to.eq(generateTotalIndexSizeQuery())
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
