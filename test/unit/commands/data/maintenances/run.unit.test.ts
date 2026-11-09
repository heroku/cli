import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import {match, SinonStub, stub} from 'sinon'

import DataMaintenancesRun from '../../../../../src/commands/data/maintenances/run.js'
import {cedarApp} from '../../../../fixtures/apps/fixtures.js'
import {maintenance} from '../../../../fixtures/data/maintenances/fixtures.js'
import {advancedAddon, legacyEssentialAddon, nonPostgresAddon} from '../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDK} from '../../../../helpers/mock-sdk.js'

const appInMaintenance = {
  ...cedarApp,
  maintenance: true,
}

type FakeData = {
  maintenance: {run: SinonStub; wait: SinonStub}
}

type FakePlatform = {
  app: {info: SinonStub}
}

function buildFakeData(): FakeData {
  return {maintenance: {run: stub(), wait: stub()}}
}

function buildFakePlatform(): FakePlatform {
  return {app: {info: stub()}}
}

function stubRun(runStub: SinonStub, result: unknown, previewAddon: unknown = advancedAddon) {
  runStub.callsFake(async (_addonIdentity, options) => {
    await options?.beforeRun?.({addon: previewAddon})
    return {addon: previewAddon, result}
  })
}

describe('data:maintenances:run', function () {
  let fakeData: FakeData
  let fakePlatform: FakePlatform
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    fakePlatform = buildFakePlatform()
    sdkMock = mockSDK(fakeData, fakePlatform)
    fakePlatform.app.info.resolves(appInMaintenance)
    stubRun(fakeData.maintenance.run, maintenance)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('runs maintenance in window with app flag', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesRun, [`--app=${appInMaintenance.name}`, advancedAddon.name])

    expect(stderr).to.contain('maintenance triggered')
    expect(stdout).to.contain('')
    expect(fakeData.maintenance.run.calledOnceWithExactly(
      advancedAddon.name,
      {appIdentity: appInMaintenance.name, beforeRun: match.func},
    )).to.equal(true)
    expect(fakePlatform.app.info.calledOnceWithExactly(advancedAddon.app.id)).to.equal(true)
  })

  it('runs maintenance in window without app flag', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesRun, [advancedAddon.name])

    expect(stderr).to.contain('maintenance triggered')
    expect(stdout).to.contain('')
    expect(fakeData.maintenance.run.calledOnceWithExactly(
      advancedAddon.name,
      {appIdentity: undefined, beforeRun: match.func},
    )).to.equal(true)
    expect(fakePlatform.app.info.calledOnceWithExactly(advancedAddon.app.id)).to.equal(true)
  })

  it('runs maintenance for non-postgres add-ons', async function () {
    stubRun(fakeData.maintenance.run, maintenance, nonPostgresAddon)

    const {stderr, stdout} = await runCommand(DataMaintenancesRun, [nonPostgresAddon.name])

    expect(stderr).to.contain('maintenance triggered')
    expect(stdout).to.contain('')
  })

  it('runs maintenance out of window with --confirm', async function () {
    fakePlatform.app.info.resolves(cedarApp)

    const {stderr, stdout} = await runCommand(DataMaintenancesRun, [
      `--confirm=${cedarApp.name}`,
      `--app=${cedarApp.name}`,
      advancedAddon.name,
    ])

    expect(stderr).to.contain('maintenance triggered')
    expect(stdout).to.contain('')
  })

  it('shows an error trying to run maintenance out of window without --force', async function () {
    fakePlatform.app.info.resolves(cedarApp)

    const {error} = await runCommand(DataMaintenancesRun, [`--app=${cedarApp.name}`, advancedAddon.name])
    const {message} = error as {message: string}
    expect(ansis.strip(message)).to.equal('To proceed, put the application into maintenance mode or re-run the command with --confirm my-cedar-app')
  })

  it('shows an error trying to run maintenance on an essential tier', async function () {
    fakeData.maintenance.run.rejects(new Error('You can\'t trigger maintenance on an Essential tier database.'))

    const {error} = await runCommand(DataMaintenancesRun, [`--app=${appInMaintenance.name}`, legacyEssentialAddon.name])
    const {message} = error as {message: string}
    expect(message).to.equal('You can\'t trigger maintenance on an Essential tier database.')
  })

  it('waits until maintenance is complete when using wait flag', async function () {
    fakeData.maintenance.wait.resolves({...maintenance, status: 'completed'})

    const {stderr, stdout} = await runCommand(DataMaintenancesRun, [`--app=${appInMaintenance.name}`, '--wait', advancedAddon.name])

    expect(stderr).to.contain('maintenance triggered')
    expect(stderr).to.contain('maintenance completed')
    expect(stdout).to.equal('')
    expect(fakeData.maintenance.wait.calledOnceWithExactly(advancedAddon.id)).to.be.true
  })
})
