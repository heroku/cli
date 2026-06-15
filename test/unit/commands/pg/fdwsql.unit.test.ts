import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd, {generateFdwsqlQuery} from '../../../../src/commands/pg/fdwsql.js'

function mockDb(planName = 'heroku-postgresql:premium-0'): pg.ConnectionDetails {
  return {
    attachment: {
      addon: {
        plan: {name: planName},
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
}

describe('pg:fdwsql', function () {
  let sandbox: sinon.SinonSandbox
  let getDatabaseStub: sinon.SinonStub
  let execQueryStub: sinon.SinonStub

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    getDatabaseStub = sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockDb())
    execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery')
    execQueryStub.resolves(`CREATE FOREIGN TABLE test_prefix_table1(col1 int, col2 text) SERVER test_prefix_db OPTIONS (schema_name 'public', table_name 'table1');
CREATE FOREIGN TABLE test_prefix_table2(col3 varchar) SERVER test_prefix_db OPTIONS (schema_name 'public', table_name 'table2');`)
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('generateFdwsqlQuery', function () {
    it('generates the exact expected SQL query', function () {
      const prefix = 'test_prefix'
      const expectedQuery = `SELECT
  'CREATE FOREIGN TABLE '
  || quote_ident('${prefix}_' || c.relname)
  || '(' || array_to_string(array_agg(quote_ident(a.attname) || ' ' || t.typname), ', ') || ') '
  || ' SERVER ${prefix}_db OPTIONS'
  || ' (schema_name ''' || quote_ident(n.nspname) || ''', table_name ''' || quote_ident(c.relname) || ''');'
FROM
  pg_class     c,
  pg_attribute a,
  pg_type      t,
  pg_namespace n
WHERE
  a.attnum > 0
  AND a.attrelid = c.oid
  AND a.atttypid = t.oid
  AND n.oid = c.relnamespace
  AND c.relkind in ('r', 'v')
  AND n.nspname <> 'pg_catalog'
  AND n.nspname <> 'information_schema'
  AND n.nspname !~ '^pg_toast'
  AND pg_catalog.pg_table_is_visible(c.oid)
GROUP BY c.relname, n.nspname
ORDER BY c.relname;`

      expect(generateFdwsqlQuery(prefix)).to.equal(expectedQuery)
    })

    it('excludes system schemas and includes only tables and views', function () {
      const query = generateFdwsqlQuery('test_prefix')
      expect(query).to.contain("n.nspname <> 'pg_catalog'")
      expect(query).to.contain("n.nspname <> 'information_schema'")
      expect(query).to.contain("n.nspname !~ '^pg_toast'")
      expect(query).to.contain("c.relkind in ('r', 'v')")
    })
  })

  describe('command behavior', function () {
    it('displays foreign data wrapper setup SQL and filtered output', async function () {
      const {stderr, stdout} = await runCommand(Cmd, ['test_prefix', '--app', 'my-app'])

      expect(stdout).to.contain('CREATE EXTENSION IF NOT EXISTS postgres_fdw;')
      expect(stdout).to.contain('DROP SERVER IF EXISTS test_prefix_db;')
      expect(stdout).to.contain('CREATE SERVER test_prefix_db')
      expect(stdout).to.contain('CREATE USER MAPPING FOR CURRENT_USER')
      expect(stdout).to.contain('CREATE FOREIGN TABLE test_prefix_table1')
      expect(stderr).to.eq('')
    })

    it('filters out non-CREATE lines from the query output', async function () {
      execQueryStub.resolves(`                              ?column?
-------------------------------------------------------
 CREATE FOREIGN TABLE test_prefix_table1(col1 int) SERVER test_prefix_db OPTIONS (schema_name 'public', table_name 'table1');
NOTICE:  some psql noise
(1 row)`)

      const {stdout} = await runCommand(Cmd, ['test_prefix', '--app', 'my-app'])

      expect(stdout).to.contain('CREATE FOREIGN TABLE test_prefix_table1')
      expect(stdout).to.not.contain('?column?')
      expect(stdout).to.not.contain('NOTICE:')
      expect(stdout).to.not.contain('(1 row)')
    })

    it('shows setup SQL even when no foreign tables are returned', async function () {
      execQueryStub.resolves('')

      const {stdout} = await runCommand(Cmd, ['test_prefix', '--app', 'my-app'])

      expect(stdout).to.contain('CREATE EXTENSION IF NOT EXISTS postgres_fdw;')
      expect(stdout).to.contain('DROP SERVER IF EXISTS test_prefix_db;')
      expect(stdout).to.contain('CREATE SERVER test_prefix_db')
      expect(stdout).to.contain('CREATE USER MAPPING FOR CURRENT_USER')
    })

    it('resolves the named database when provided', async function () {
      await runCommand(Cmd, ['test_prefix', 'custom-db', '--app', 'my-app'])
      expect(getDatabaseStub.calledOnceWith('my-app', 'custom-db')).to.be.true
    })

    it('errors on essential-tier databases', async function () {
      getDatabaseStub.resolves(mockDb('heroku-postgresql:essential-0'))

      const {error} = await runCommand(Cmd, ['test_prefix', '--app', 'my-app'])

      expect(error?.message).to.contain('This operation is not supported by Essential-tier databases.')
    })
  })

  describe('error handling', function () {
    it('surfaces database connection failures', async function () {
      getDatabaseStub.rejects(new Error('Database connection failed'))
      const {error} = await runCommand(Cmd, ['test_prefix', '--app', 'my-app'])
      expect(error?.message).to.contain('Database connection failed')
    })

    it('surfaces SQL execution failures', async function () {
      execQueryStub.rejects(new Error('SQL execution failed'))
      const {error} = await runCommand(Cmd, ['test_prefix', '--app', 'my-app'])
      expect(error?.message).to.contain('SQL execution failed')
    })
  })
})
