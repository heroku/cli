import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgUpgradeWait from '../../../../../../src/commands/data/pg/upgrade/wait.js'
import {WaitStatus} from '../../../../../../src/lib/data/types.js'
import {
  advancedAddon,
  standardAddon,
  waitStatusAvailable,
  waitStatusUpgrading,
} from '../../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc

interface FakeData {
  postgres: {waitForReady: SinonStub}
}

type WaitForReadyOptions = {
  onPoll?: (status: WaitStatus) => void
  onResolved?: (addon: {name: string}) => Promise<void> | void
  waitIntervalMs?: number
}

// data:pg:upgrade:wait is data:pg:wait with an upgrade-specific description and
// classic-command hint; it inherits the migrated run(), so it delegates
// resolution, the Advanced-tier gate, and the poll loop to
// data.postgres.waitForReady. This fake stands in for the resolving method: it
// fires `onResolved` with the resolved add-on (as the real method does before
// its first poll), then drives `onPoll` once per supplied status, then returns
// the terminal result — so the command's UX branches are exercised without HTTP.
const waitResolvingThrough = (statuses: WaitStatus[], resolved = advancedAddon) =>
  async (_app: string, _db: string, options: WaitForReadyOptions = {}) => {
    await options.onResolved?.(resolved)
    for (const status of statuses) options.onPoll?.(status)
    return {addon: resolved, result: statuses.at(-1)}
  }

describe('data:pg:upgrade:wait', function () {
  let fakeData: FakeData
  let notifyStub: SinonStub

  beforeEach(function () {
    fakeData = {postgres: {waitForReady: stub()}}
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
    notifyStub = stub(DataPgUpgradeWait.prototype, 'notify')
  })

  afterEach(function () {
    restore()
  })

  describe('database resolution', function () {
    it('does not wait when database is already available', async function () {
      fakeData.postgres.waitForReady.callsFake(waitResolvingThrough([waitStatusAvailable]))

      const {stderr, stdout} = await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp'])

      const [app, database] = fakeData.postgres.waitForReady.firstCall.args
      expect(app).to.equal('myapp')
      expect(database).to.equal('DATABASE')
      expect(stdout).to.contain('advanced-horizontal-01234 is available')
      expect(stderr).to.not.contain('Waiting for database')
      expect(notifyStub.called).to.be.false
    })

    it('waits for database through multiple status transitions', async function () {
      const transitions: WaitStatus[] = [
        {message: 'Upgrading...', waiting: true},
        {message: 'Promoting...', waiting: true},
        waitStatusAvailable,
      ]
      fakeData.postgres.waitForReady.callsFake(waitResolvingThrough(transitions))

      const {stderr} = await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp', '--wait-interval=1'])

      expect(stderr).to.contain('Waiting for database advanced-horizontal-01234')
      expect(stderr).to.contain('available')
      expect(notifyStub.calledOnce).to.be.true
    })

    it('waits for database with upgrading status', async function () {
      fakeData.postgres.waitForReady.callsFake(waitResolvingThrough([waitStatusUpgrading, waitStatusAvailable]))

      const {stderr} = await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp', '--wait-interval=1'])

      expect(stderr).to.contain('Waiting for database advanced-horizontal-01234')
      expect(stderr).to.contain('available')
      expect(notifyStub.calledOnce).to.be.true
    })
  })

  describe('error handling', function () {
    it('errors when database is not Advanced-tier', async function () {
      // The SDK gates on tier and rejects before firing onResolved; the command
      // catches NotAdvancedDatabaseError and renders the classic-command hint.
      fakeData.postgres.waitForReady.rejects(new NotAdvancedDatabaseError(standardAddon, 'not advanced'))

      const {error} = await runCommand(DataPgUpgradeWait, ['STANDARD_DATABASE', '--app=myapp'])
      expect(error).to.exist
      const err = error as Error
      expect(ansis.strip(err.message)).to.equal(heredoc`
          You can only use this command on Advanced-tier databases.
          Use heroku pg:upgrade:wait standard-database -a myapp instead.`)
    })

    it('handles API errors gracefully', async function () {
      fakeData.postgres.waitForReady.rejects(new Error('Internal Server Error'))

      const {error} = await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp'])
      expect(error).to.exist
      const err = error as Error
      expect(err.message).to.include('Internal Server Error')
    })
  })

  describe('flags', function () {
    it('respects --no-notify flag', async function () {
      fakeData.postgres.waitForReady.callsFake(waitResolvingThrough([waitStatusUpgrading, waitStatusAvailable]))

      const {stderr} = await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp', '--no-notify', '--wait-interval=1'])

      expect(stderr).to.contain('Waiting for database advanced-horizontal-01234')
      expect(stderr).to.contain('available')
      expect(notifyStub.called).to.be.false
    })

    it('passes --wait-interval through to the SDK as milliseconds', async function () {
      fakeData.postgres.waitForReady.callsFake(waitResolvingThrough([waitStatusUpgrading, waitStatusAvailable]))

      const {stderr} = await runCommand(DataPgUpgradeWait, ['DATABASE', '--app=myapp', '--wait-interval=2'])

      expect(fakeData.postgres.waitForReady.firstCall.args[2].waitIntervalMs).to.equal(2000)
      expect(stderr).to.contain('Waiting for database advanced-horizontal-01234')
      expect(stderr).to.contain('available')
    })
  })
})
