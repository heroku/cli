import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {match, SinonStub, stub} from 'sinon'

import DataMaintenancesWindowUpdate from '../../../../../../src/commands/data/maintenances/window/update.js'
import {maintenanceWindow} from '../../../../../fixtures/data/maintenances/fixtures.js'
import {advancedAddon, nonPostgresAddon} from '../../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

type FakeData = {
  maintenance: {updateWindow: SinonStub}
}

function buildFakeData(): FakeData {
  return {maintenance: {updateWindow: stub()}}
}

function stubUpdateWindow(updateWindowStub: SinonStub, previewAddon: unknown = advancedAddon) {
  updateWindowStub.callsFake(async (_addonIdentity, _body, options) => {
    await options?.beforeUpdateWindow?.({addon: previewAddon})
    return {addon: previewAddon, window: maintenanceWindow}
  })
}

describe('data:maintenances:window:update', function () {
  const app = {
    name: 'test-app',
  }

  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
    stubUpdateWindow(fakeData.maintenance.updateWindow)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('can change a window for an addon', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesWindowUpdate, [advancedAddon.name, 'tuesday', '5:30PM'])

    expect(stderr).to.contain(`Setting maintenance window for ${advancedAddon.name} to tuesday 5:30PM... done`)
    expect(stdout).to.contain('previous_window: Fridays 17:30 to 21:30 UTC\n')
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
    expect(fakeData.maintenance.updateWindow.calledOnceWithExactly(
      advancedAddon.name,
      {day_of_week: 'tuesday', time_of_day: '5:30PM'},
      {appIdentity: undefined, beforeUpdateWindow: match.func},
    )).to.be.true
  })

  it('can change a window for an addon scoped by an app', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesWindowUpdate, [advancedAddon.name, 'tuesday', '5:30PM', `--app=${app.name}`])

    expect(stderr).to.contain(`Setting maintenance window for ${advancedAddon.name} to tuesday 5:30PM... done`)
    expect(stdout).to.contain('previous_window: Fridays 17:30 to 21:30 UTC\n')
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
    expect(fakeData.maintenance.updateWindow.calledOnceWithExactly(
      advancedAddon.name,
      {day_of_week: 'tuesday', time_of_day: '5:30PM'},
      {appIdentity: app.name, beforeUpdateWindow: match.func},
    )).to.be.true
  })

  it('can change a window for a non-postgres addon', async function () {
    stubUpdateWindow(fakeData.maintenance.updateWindow, nonPostgresAddon)

    const {stderr, stdout} = await runCommand(DataMaintenancesWindowUpdate, [nonPostgresAddon.name, 'tuesday', '5:30PM'])

    expect(stderr).to.contain(`Setting maintenance window for ${nonPostgresAddon.name} to tuesday 5:30PM... done`)
    expect(stdout).to.contain('previous_window: Fridays 17:30 to 21:30 UTC\n')
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })
})
