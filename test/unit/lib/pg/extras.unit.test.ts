import {pg, utils} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import * as sinon from 'sinon'

import {
  ensureEssentialTierPlan,
  ensurePGStatStatement,
  essentialNumPlan,
  newBlkTimeFields,
  newTotalExecTimeField,
} from '../../../../src/lib/pg/extras.js'

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

describe('lib/pg/extras', function () {
  let sandbox: sinon.SinonSandbox
  let execQueryStub: sinon.SinonStub
  let uxErrorStub: sinon.SinonStub

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery')
    uxErrorStub = sandbox.stub(ux, 'error')
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('ensurePGStatStatement', function () {
    it('succeeds when pg_stat_statements is available', async function () {
      execQueryStub.resolves('t')

      await ensurePGStatStatement(mockDb())

      expect(execQueryStub.calledOnce).to.be.true
      expect(execQueryStub.firstCall.args[0]).to.include('pg_stat_statements')
      expect(uxErrorStub.called).to.be.false
    })

    it('checks both public and heroku_ext schemas for pg_stat_statements', async function () {
      execQueryStub.resolves('t')

      await ensurePGStatStatement(mockDb())

      const querySql = execQueryStub.firstCall.args[0]
      expect(querySql).to.include('pg_stat_statements')
      expect(querySql).to.include("'public'")
      expect(querySql).to.include("'heroku_ext'")
    })

    it('detects pg_stat_statements when it is installed in the heroku_ext schema', async function () {
      // Simulate a database where the extension lives in heroku_ext (standard for
      // modern Heroku Postgres) and NOT in public. The check only succeeds if the
      // query actually looks in heroku_ext, so this fails on the public-only bug.
      execQueryStub.callsFake((query: string) => Promise.resolve(query.includes("'heroku_ext'") ? 't' : 'f'))

      await ensurePGStatStatement(mockDb())

      expect(uxErrorStub.called).to.be.false
    })

    it('propagates the error when psql exec fails', async function () {
      execQueryStub.rejects(new Error('boom'))

      await expect(ensurePGStatStatement(mockDb())).to.be.rejectedWith('boom')
    })

    it('calls ux.error when pg_stat_statements is not available', async function () {
      execQueryStub.resolves('f')

      await ensurePGStatStatement(mockDb())

      expect(uxErrorStub.calledOnce).to.be.true
      expect(uxErrorStub.firstCall.args[1]).to.deep.equal({exit: 1})
    })
  })

  describe('ensureEssentialTierPlan', function () {
    it('succeeds for non-essential tier plans', async function () {
      await ensureEssentialTierPlan(mockDb('heroku-postgresql:premium-0'))
      expect(uxErrorStub.called).to.be.false
    })

    it('calls ux.error for dev tier plans', async function () {
      await ensureEssentialTierPlan(mockDb('heroku-postgresql:dev'))
      expect(uxErrorStub.calledOnce).to.be.true
      expect(uxErrorStub.firstCall.args[1]).to.deep.equal({exit: 1})
    })

    it('calls ux.error for basic tier plans', async function () {
      await ensureEssentialTierPlan(mockDb('heroku-postgresql:basic'))
      expect(uxErrorStub.calledOnce).to.be.true
      expect(uxErrorStub.firstCall.args[1]).to.deep.equal({exit: 1})
    })

    it('calls ux.error for essential tier plans', async function () {
      await ensureEssentialTierPlan(mockDb('heroku-postgresql:essential-0'))
      expect(uxErrorStub.calledOnce).to.be.true
      expect(uxErrorStub.firstCall.args[1]).to.deep.equal({exit: 1})
    })

    it('calls ux.error when plan name is missing', async function () {
      const db = mockDb()
      // @ts-expect-error - intentionally clearing the plan name for the test
      db.attachment.addon.plan.name = undefined

      await ensureEssentialTierPlan(db)

      expect(uxErrorStub.calledOnce).to.be.true
      expect(uxErrorStub.firstCall.args[1]).to.deep.equal({exit: 1})
    })
  })

  describe('essentialNumPlan', function () {
    it('returns true for essential-numbered plans', function () {
      expect(essentialNumPlan({plan: {name: 'heroku-postgresql:essential-0'}})).to.be.true
    })

    it('returns false for non-essential plans', function () {
      expect(essentialNumPlan({plan: {name: 'heroku-postgresql:premium-0'}})).to.be.false
    })

    it('returns false when plan name is missing', function () {
      expect(essentialNumPlan({plan: {}})).to.be.false
    })

    it('returns false when plan name has no tier segment', function () {
      expect(essentialNumPlan({plan: {name: 'heroku-postgresql'}})).to.be.false
    })
  })

  describe('newTotalExecTimeField', function () {
    it('returns true when server reports t', async function () {
      execQueryStub.resolves('t\n')
      expect(await newTotalExecTimeField(mockDb())).to.be.true
      expect(execQueryStub.firstCall.args[1]).to.deep.equal(['-t', '-q'])
    })

    it('returns false when server reports f', async function () {
      execQueryStub.resolves('f\n')
      expect(await newTotalExecTimeField(mockDb())).to.be.false
    })

    it('calls ux.error for an unexpected response', async function () {
      execQueryStub.resolves('garbage\n')
      await newTotalExecTimeField(mockDb())
      expect(uxErrorStub.calledOnce).to.be.true
      expect(uxErrorStub.firstCall.args[1]).to.deep.equal({exit: 1})
    })

    it('propagates the error when the query fails', async function () {
      execQueryStub.rejects(new Error('boom'))
      await expect(newTotalExecTimeField(mockDb())).to.be.rejectedWith('boom')
    })
  })

  describe('newBlkTimeFields', function () {
    it('returns true when server reports t', async function () {
      execQueryStub.resolves('t\n')
      expect(await newBlkTimeFields(mockDb())).to.be.true
      expect(execQueryStub.firstCall.args[1]).to.deep.equal(['-t', '-q'])
    })

    it('returns false when server reports f', async function () {
      execQueryStub.resolves('f\n')
      expect(await newBlkTimeFields(mockDb())).to.be.false
    })

    it('calls ux.error for an unexpected response', async function () {
      execQueryStub.resolves('garbage\n')
      await newBlkTimeFields(mockDb())
      expect(uxErrorStub.calledOnce).to.be.true
      expect(uxErrorStub.firstCall.args[1]).to.deep.equal({exit: 1})
    })

    it('propagates the error when the query fails', async function () {
      execQueryStub.rejects(new Error('boom'))
      await expect(newBlkTimeFields(mockDb())).to.be.rejectedWith('boom')
    })
  })

  describe('error propagation', function () {
    beforeEach(function () {
      // Let ux.error throw as it does in production (instead of the no-op stub),
      // so we can assert the real, user-visible message propagates uncaught.
      uxErrorStub.restore()
    })

    it('newTotalExecTimeField surfaces the real version error on an unexpected response', async function () {
      execQueryStub.resolves('garbage\n')
      await expect(newTotalExecTimeField(mockDb())).to.be.rejectedWith('Unable to determine database version')
    })

    it('newBlkTimeFields surfaces the real version error on an unexpected response', async function () {
      execQueryStub.resolves('garbage\n')
      await expect(newBlkTimeFields(mockDb())).to.be.rejectedWith('Unable to determine database version')
    })
  })
})
