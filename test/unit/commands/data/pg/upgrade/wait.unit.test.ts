import {utils} from '@heroku/heroku-cli-util'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgUpgradeWait from '../../../../../../src/commands/data/pg/upgrade/wait.js'
import {WaitStatus} from '../../../../../../src/lib/data/types.js'
import {
  addon,
  advancedAddonAttachment,
  nonAdvancedAddonAttachment,
  waitStatusAvailable,
  waitStatusUpgrading,
} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('data:pg:upgrade:wait', function () {
  let dataApi: nock.Scope
  let notifyStub: sinon.SinonStub
  let resolverStub: sinon.SinonStub

  beforeEach(function () {
    dataApi = nock('https://api.data.heroku.com')
    notifyStub = sinon.stub(DataPgUpgradeWait.prototype, 'notify')
    resolverStub = sinon.stub(utils.pg.DatabaseResolver.prototype, 'getAttachment')
  })

  afterEach(function () {
    dataApi.done()
    sinon.restore()
  })

  describe('database resolution', function () {
    it('does not wait when database is already available', async function () {
      dataApi
        .get(`/data/postgres/v1/${addon.id}/wait_status`)
        .reply(200, waitStatusAvailable)
      resolverStub.resolves(advancedAddonAttachment)

      await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp'])

      expect(stdout.output).to.contain('advanced-horizontal-01234 is available')
      expect(stderr.output).to.not.contain('Waiting for database')
      expect(notifyStub.called).to.be.false
    })

    it('waits for database through multiple status transitions', async function () {
      const waitingStatus1: WaitStatus = {
        message: 'Upgrading...',
        waiting: true,
      }
      const waitingStatus2: WaitStatus = {
        message: 'Promoting...',
        waiting: true,
      }

      dataApi
        .get(`/data/postgres/v1/${addon.id}/wait_status`)
        .reply(200, waitingStatus1)
        .get(`/data/postgres/v1/${addon.id}/wait_status`)
        .reply(200, waitingStatus2)
        .get(`/data/postgres/v1/${addon.id}/wait_status`)
        .reply(200, waitStatusAvailable)
      resolverStub.resolves(advancedAddonAttachment)

      await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp', '--wait-interval=1'])

      expect(stderr.output).to.contain('Waiting for database advanced-horizontal-01234')
      expect(stderr.output).to.contain('available')
      expect(notifyStub.calledOnce).to.be.true
    })

    it('waits for database with upgrading status', async function () {
      dataApi
        .get(`/data/postgres/v1/${addon.id}/wait_status`)
        .reply(200, waitStatusUpgrading)
        .get(`/data/postgres/v1/${addon.id}/wait_status`)
        .reply(200, waitStatusAvailable)
      resolverStub.resolves(advancedAddonAttachment)

      await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp', '--wait-interval=1'])

      expect(stderr.output).to.contain('Waiting for database advanced-horizontal-01234')
      expect(stderr.output).to.contain('available')
      expect(notifyStub.calledOnce).to.be.true
    })
  })

  describe('error handling', function () {
    it('errors when database is not Advanced-tier', async function () {
      resolverStub.resolves(nonAdvancedAddonAttachment)

      try {
        await runCommand(DataPgUpgradeWait, ['STANDARD_DATABASE', '--app=myapp'])
        expect.fail('Expected command to throw an error')
      } catch (error: unknown) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.equal(heredoc`
          You can only use this command on Advanced-tier databases.
          Use heroku pg:upgrade:wait standard-database -a myapp instead.`)
      }
    })

    it('handles API errors gracefully', async function () {
      dataApi
        .get(`/data/postgres/v1/${addon.id}/wait_status`)
        .reply(500, {id: 'server_error', message: 'Internal Server Error'})
      resolverStub.resolves(advancedAddonAttachment)

      try {
        await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp'])
        expect.fail('Expected command to throw an error')
      } catch (error: unknown) {
        const err = error as Error
        expect(err.message).to.include('Internal Server Error')
      }
    })
  })

  describe('flags', function () {
    it('respects --no-notify flag', async function () {
      dataApi
        .get(`/data/postgres/v1/${addon.id}/wait_status`)
        .reply(200, waitStatusUpgrading)
        .get(`/data/postgres/v1/${addon.id}/wait_status`)
        .reply(200, waitStatusAvailable)
      resolverStub.resolves(advancedAddonAttachment)

      await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp', '--no-notify', '--wait-interval=1'])

      expect(stderr.output).to.contain('Waiting for database advanced-horizontal-01234')
      expect(stderr.output).to.contain('available')
      expect(notifyStub.called).to.be.false
    })

    it('respects --wait-interval flag', async function () {
      dataApi
        .get(`/data/postgres/v1/${addon.id}/wait_status`)
        .reply(200, waitStatusUpgrading)
        .get(`/data/postgres/v1/${addon.id}/wait_status`)
        .reply(200, waitStatusAvailable)
      resolverStub.resolves(advancedAddonAttachment)

      await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp', '--wait-interval=2'])

      expect(stderr.output).to.contain('Waiting for database advanced-horizontal-01234')
      expect(stderr.output).to.contain('available')
    })
  })
})
