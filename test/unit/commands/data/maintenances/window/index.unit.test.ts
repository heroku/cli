import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {match, SinonStub, stub} from 'sinon'

import DataMaintenancesWindow from '../../../../../../src/commands/data/maintenances/window/index.js'
import {maintenanceWindow} from '../../../../../fixtures/data/maintenances/fixtures.js'
import {advancedAddon, nonPostgresAddon} from '../../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

type FakeData = {
  maintenance: {window: SinonStub}
}

function buildFakeData(): FakeData {
  return {maintenance: {window: stub()}}
}

function stubWindow(windowStub: SinonStub, previewAddon: unknown = advancedAddon) {
  windowStub.callsFake(async (_addonIdentity, options) => {
    await options?.beforeGetWindow?.({addon: previewAddon})
    return {addon: previewAddon, window: maintenanceWindow}
  })
}

describe('data:maintenances:window', function () {
  const app = {
    name: 'test-app',
  }

  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
    stubWindow(fakeData.maintenance.window)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('can fetch a window for an addon', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesWindow, [advancedAddon.name])

    expect(stderr).to.contain(`Fetching maintenance window for ${advancedAddon.name}... done\n`)
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
    expect(fakeData.maintenance.window.calledOnceWithExactly(
      advancedAddon.name,
      {appIdentity: undefined, beforeGetWindow: match.func},
    )).to.be.true
  })

  it('can fetch a window for an addon scoped by an app', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesWindow, [advancedAddon.name, `--app=${app.name}`])

    expect(stderr).to.contain(`Fetching maintenance window for ${advancedAddon.name}... done\n`)
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
    expect(fakeData.maintenance.window.calledOnceWithExactly(
      advancedAddon.name,
      {appIdentity: app.name, beforeGetWindow: match.func},
    )).to.be.true
  })

  it('can fetch a window for a non-postgres addon', async function () {
    stubWindow(fakeData.maintenance.window, nonPostgresAddon)

    const {stderr, stdout} = await runCommand(DataMaintenancesWindow, [nonPostgresAddon.name])

    expect(stderr).to.contain(`Fetching maintenance window for ${nonPostgresAddon.name}... done\n`)
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })
})
