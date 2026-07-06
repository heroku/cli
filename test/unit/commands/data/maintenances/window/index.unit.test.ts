import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {stub} from 'sinon'

import DataMaintenancesWindow from '../../../../../../src/commands/data/maintenances/window/index.js'
import {maintenanceWindow} from '../../../../../fixtures/data/maintenances/fixtures.js'
import {addon, nonPostgresAddon} from '../../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

describe('data:maintenances:window', function () {
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

  it('can fetch a window for an addon', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const windowStub = stub().resolves(maintenanceWindow)
    sdkMock = mockSDKData({maintenance: {window: windowStub}})

    const {stderr, stdout} = await runCommand(DataMaintenancesWindow, [addon.name])

    expect(stderr).to.contain(`Fetching maintenance window for ${addon.name}... done\n`)
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })

  it('can fetch a window for an addon scoped by an app', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const windowStub = stub().resolves(maintenanceWindow)
    sdkMock = mockSDKData({maintenance: {window: windowStub}})

    const {stderr, stdout} = await runCommand(DataMaintenancesWindow, [addon.name, `--app=${app.name}`])

    expect(stderr).to.contain(`Fetching maintenance window for ${addon.name}... done\n`)
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })

  it('can fetch a window for a non-postgres addon', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve', body => body.addon_service === undefined)
      .reply(200, [nonPostgresAddon])

    const windowStub = stub().resolves(maintenanceWindow)
    sdkMock = mockSDKData({maintenance: {window: windowStub}})

    const {stderr, stdout} = await runCommand(DataMaintenancesWindow, [nonPostgresAddon.name])

    expect(stderr).to.contain(`Fetching maintenance window for ${nonPostgresAddon.name}... done\n`)
    expect(stdout).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })
})
