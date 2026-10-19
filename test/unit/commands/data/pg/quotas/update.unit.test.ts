import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {getPostgresServiceName} from '@heroku/sdk/resources/data/postgres-database'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgQuotasUpdate from '../../../../../../src/commands/data/pg/quotas/update.js'
import {
  addon,
  nonAdvancedAddon,
  storageQuotaResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc

type FakeData = {
  postgresQuota: {update: SinonStub}
}

type FakePlatform = {
  addOn: {resolve: SinonStub}
}

function buildFakeData(): FakeData {
  return {postgresQuota: {update: stub()}}
}

function buildFakePlatform(): FakePlatform {
  return {addOn: {resolve: stub()}}
}

describe('data:pg:quotas:update', function () {
  let fakeData: FakeData
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakeData = buildFakeData()
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('prints the updated quota settings when the quota update is successful', async function () {
    fakePlatform.addOn.resolve.resolves(addon)
    fakeData.postgresQuota.update.resolves(storageQuotaResponse)

    const {stderr, stdout} = await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--warning=50',
      '--critical=100',
      '--enforcement-action=none',
    ])

    expect(stderr).to.equal(heredoc(`
      Updating storage quota on ⛁ advanced-horizontal-01234... done
    `))
    expect(stdout).to.equal(heredoc(`
      === Storage

      Warning:            50.00 GB
      Critical:           100.00 GB
      Enforcement Action: None
      Status:             0.00 MB / 100.00 GB (Within configured quotas)
    `))
    expect(fakePlatform.addOn.resolve.calledOnceWithExactly('advanced-horizontal-01234', {
      addonService: getPostgresServiceName(),
      appIdentity: 'myapp',
    })).to.equal(true)
  })

  it('sends the correct quota updates to the data API', async function () {
    fakePlatform.addOn.resolve.resolves(addon)
    fakeData.postgresQuota.update.resolves(storageQuotaResponse)

    await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--warning=50',
      '--critical=100',
      '--enforcement-action=none',
    ])

    expect(fakeData.postgresQuota.update.calledOnceWithExactly(addon.id, 'storage', {
      critical_gb: 100,
      enforcement_action: 'none',
      warning_gb: 50,
    })).to.equal(true)
  })

  it('sets the warning_gb to null when the warning flag is set to "none"', async function () {
    fakePlatform.addOn.resolve.resolves(addon)
    fakeData.postgresQuota.update.resolves(storageQuotaResponse)

    await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--warning=none',
    ])

    expect(fakeData.postgresQuota.update.calledOnceWithExactly(addon.id, 'storage', {
      warning_gb: null,
    })).to.equal(true)
  })

  it('sets the critical_gp to null when the critical flag is set to "none"', async function () {
    fakePlatform.addOn.resolve.resolves(addon)
    fakeData.postgresQuota.update.resolves(storageQuotaResponse)

    await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--critical=none',
    ])

    expect(fakeData.postgresQuota.update.calledOnceWithExactly(addon.id, 'storage', {
      critical_gb: null,
    })).to.equal(true)
  })

  it('will fail if neither of the warning, critical, or enforcement-action flags are set', async function () {
    const {error} = await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You must set a value for either the warning, critical, or enforcement-action flags')
    expect(fakePlatform.addOn.resolve.called).to.equal(false)
  })

  it('errors when used with non-Advanced-tier add-ons', async function () {
    fakePlatform.addOn.resolve.resolves(nonAdvancedAddon)

    const {error} = await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--warning=50',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases.')
    expect(fakeData.postgresQuota.update.called).to.equal(false)
  })

  it('errors when the --warning flag is not an integer or "none"', async function () {
    const {error} = await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--warning=nope',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal(heredoc(`
        Parsing --warning
        You can only enter an integer or "none" in the --warning flag.
        See more help with --help
      `))
  })

  it('errors when the --critical flag is not an integer or "none"', async function () {
    const {error} = await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--critical=nope',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal(heredoc(`
        Parsing --critical
        You can only enter an integer or "none" in the --critical flag.
        See more help with --help
        `))
  })
})
