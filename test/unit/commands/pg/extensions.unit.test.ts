import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd, {generateExtensionsQuery} from '../../../../src/commands/pg/extensions.js'

function mockDb(planName: string): pg.ConnectionDetails {
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

describe('pg:extensions', function () {
  let sandbox: sinon.SinonSandbox
  let getDatabaseStub: sinon.SinonStub
  let execQueryStub: sinon.SinonStub

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    getDatabaseStub = sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockDb('heroku-postgresql:premium-0'))
    execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery')
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('generateExtensionsQuery', function () {
    it('restricts extensions for essential plans', function () {
      const expectedQuery = `SELECT *
                     FROM pg_available_extensions
                     WHERE name IN (SELECT unnest(string_to_array(current_setting('rds.allowed_extensions'), ',')))`
      const query = generateExtensionsQuery(mockDb('heroku-postgresql:essential-0'))
      expect(query).to.equal(expectedQuery)
      expect(query).to.contain('rds.allowed_extensions')
    })

    it('shows all whitelisted extensions for standard plans', function () {
      const expectedQuery = `SELECT *
                     FROM pg_available_extensions
                     WHERE name IN (SELECT unnest(string_to_array(current_setting('extwlist.extensions'), ',')))`
      const query = generateExtensionsQuery(mockDb('heroku-postgresql:premium-0'))
      expect(query).to.equal(expectedQuery)
      expect(query).to.contain('extwlist.extensions')
    })
  })

  describe('command behavior', function () {
    it('displays extensions information', async function () {
      const mockOutput = `name | version | schema | description
-----|---------|--------|-------------
plpgsql | 1.0 | pg_catalog | PL/pgSQL procedural language`
      execQueryStub.resolves(mockOutput)

      const {stderr, stdout} = await runCommand(Cmd, ['--app', 'my-app'])

      expect(getDatabaseStub.calledOnceWith('my-app')).to.be.true
      expect(execQueryStub.calledOnce).to.be.true
      expect(stdout).to.contain(mockOutput)
      expect(stderr).to.eq('')
    })

    it('uses the essential-tier query when the db is on an essential plan', async function () {
      getDatabaseStub.resolves(mockDb('heroku-postgresql:essential-0'))
      execQueryStub.resolves('')

      await runCommand(Cmd, ['--app', 'my-app'])

      expect(execQueryStub.getCall(0).args[0]).to.contain('rds.allowed_extensions')
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
