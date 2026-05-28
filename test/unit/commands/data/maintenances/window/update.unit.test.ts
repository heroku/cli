import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {stub} from 'sinon'

import DataMaintenancesWindowUpdate from '../../../../../../src/commands/data/maintenances/window/update.js'
import {maintenanceWindow} from '../../../../../fixtures/data/maintenances/fixtures.js'
import {addon, nonPostgresAddon} from '../../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

describe('data:maintenances:window:update', function () {
  const app = {
    name: 'test-app',
  }

  let herokuApi: nock.Scope
  let sdkMock: MockSDK

  afterEach(function () {
    herokuApi.done()
    nock.cleanAll()
    sdkMock?.restore()
  })

  it('can change a window for an addon', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const updateWindowStub = stub().resolves(maintenanceWindow)
    sdkMock = mockSDKData({maintenance: {updateWindow: updateWindowStub}})

    const {stderr, stdout} = await runCommand(DataMaintenancesWindowUpdate, [addon.name, 'tuesday', '5:30PM'])

    expect(stderr).to.contain(`Setting maintenance window for ${addon.name} to tuesday 5:30PM... done`)
    expect(stdout).to.contain('previous_window: Fridays 17:30 to 21:30 UTC\n')
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })

  it('can change a window for an addon scoped by an app', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const updateWindowStub = stub().resolves(maintenanceWindow)
    sdkMock = mockSDKData({maintenance: {updateWindow: updateWindowStub}})

    const {stderr, stdout} = await runCommand(DataMaintenancesWindowUpdate, [addon.name, 'tuesday', '5:30PM', `--app=${app.name}`])

    expect(stderr).to.contain(`Setting maintenance window for ${addon.name} to tuesday 5:30PM... done`)
    expect(stdout).to.contain('previous_window: Fridays 17:30 to 21:30 UTC\n')
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })

  it('can change a window for a non-postgres addon', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve', body => body.addon_service === undefined)
      .reply(200, [nonPostgresAddon])

    const updateWindowStub = stub().resolves(maintenanceWindow)
    sdkMock = mockSDKData({maintenance: {updateWindow: updateWindowStub}})

    const {stderr, stdout} = await runCommand(DataMaintenancesWindowUpdate, [nonPostgresAddon.name, 'tuesday', '5:30PM'])

    expect(stderr).to.contain(`Setting maintenance window for ${nonPostgresAddon.name} to tuesday 5:30PM... done`)
    expect(stdout).to.contain('previous_window: Fridays 17:30 to 21:30 UTC\n')
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })
})
