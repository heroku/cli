import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd, {generateIndexSizeQuery} from '../../../../src/commands/pg/index-size.js'

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

describe('pg:index-size', function () {
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

  describe('generateIndexSizeQuery', function () {
    it('generates the exact expected SQL query', function () {
      const expectedQuery = `SELECT c.relname AS name,
  pg_size_pretty(sum(c.relpages::bigint*8192)::bigint) AS size
FROM pg_class c
LEFT JOIN pg_namespace n ON (n.oid = c.relnamespace)
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
AND n.nspname !~ '^pg_toast'
AND c.relkind='i'
GROUP BY c.relname
ORDER BY sum(c.relpages) DESC;`

      expect(generateIndexSizeQuery()).to.equal(expectedQuery)
    })

    it('excludes system schemas and includes only indexes', function () {
      const query = generateIndexSizeQuery()
      expect(query).to.contain("n.nspname NOT IN ('pg_catalog', 'information_schema')")
      expect(query).to.contain("n.nspname !~ '^pg_toast'")
      expect(query).to.contain("c.relkind='i'")
      expect(query).to.contain('sum(c.relpages::bigint*8192)')
      expect(query).to.contain('pg_size_pretty')
    })
  })

  describe('command behavior', function () {
    it('displays index size information', async function () {
      const mockOutput = `name | size
-----|-----
idx_users_email | 2.1 MB
idx_posts_title | 1.8 MB`
      execQueryStub.resolves(mockOutput)

      const {stderr, stdout} = await runCommand(Cmd, ['--app', 'my-app'])

      expect(getDatabaseStub.calledOnceWith('my-app')).to.be.true
      expect(execQueryStub.calledOnceWith(generateIndexSizeQuery())).to.be.true
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
