import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stub} from 'sinon'

import DataMaintenancesWait from '../../../../../src/commands/data/maintenances/wait.js'
import {Maintenance, MaintenanceStatus} from '../../../../../src/lib/data/types.js'
import {maintenance} from '../../../../fixtures/data/maintenances/fixtures.js'
import {addon, nonPostgresAddon} from '../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const completedMaintenance: Maintenance = {
  ...maintenance,
  status: MaintenanceStatus.completed,
}

const runningMaintenance: Maintenance = {
  ...maintenance,
  status: MaintenanceStatus.running,
}

describe('data:maintenances:wait', function () {
  let herokuApi: nock.Scope
  let sdkMock: MockSDK

  afterEach(function () {
    herokuApi.done()
    nock.cleanAll()
    sdkMock?.restore()
  })

  it('waits until maintenance is complete', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    // Initial info call via SDK
    const infoStub = stub().resolves(runningMaintenance)
    sdkMock = mockSDKData({maintenance: {info: infoStub}})

    // Polling via BaseDataCommand's dataApi (api.data.heroku.com)
    const legacyDataApi = nock('https://api.data.heroku.com')
    let pollingCalls = 0
    legacyDataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .thrice()
      .reply(() => {
        pollingCalls++

        return pollingCalls === 3
          ? [200, completedMaintenance]
          : [200, runningMaintenance]
      })

    const {stderr} = await runCommand(DataMaintenancesWait, [addon.name])

    expect(stderr).to.contain(`Waiting for maintenance on ${addon.name} to complete`)
    expect(stderr).to.contain('maintenance completed')
    legacyDataApi.done()
  })

  it('waits until maintenance is complete scoped by optional app flag', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    // Initial info call via SDK
    const infoStub = stub().resolves(runningMaintenance)
    sdkMock = mockSDKData({maintenance: {info: infoStub}})

    // Polling via BaseDataCommand's dataApi (api.data.heroku.com)
    const legacyDataApi = nock('https://api.data.heroku.com')
    let pollingCalls = 0
    legacyDataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .thrice()
      .reply(() => {
        pollingCalls++

        return pollingCalls === 3
          ? [200, completedMaintenance]
          : [200, runningMaintenance]
      })

    const {stderr} = await runCommand(DataMaintenancesWait, [addon.name, `--app=${addon.app.name}`])

    expect(stderr).to.contain(`Waiting for maintenance on ${addon.name} to complete`)
    expect(stderr).to.contain('maintenance completed')
    legacyDataApi.done()
  })

  it('shows error if initial maintenance state is not running', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    // Initial info call via SDK returns completed maintenance
    const infoStub = stub().resolves(completedMaintenance)
    sdkMock = mockSDKData({maintenance: {info: infoStub}})

    const {error} = await runCommand(DataMaintenancesWait, [addon.name])
    const {message} = error as {message: string}
    expect(ansis.strip(message)).to.equal(`There currently isn't any maintenance in progress for ${addon.name}`)
  })

  it('waits for non-postgres add-ons', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve', body => body.addon_service === undefined)
      .reply(200, [nonPostgresAddon])

    // Initial info call via SDK
    const infoStub = stub().resolves(runningMaintenance)
    sdkMock = mockSDKData({maintenance: {info: infoStub}})

    // Polling via BaseDataCommand's dataApi (api.data.heroku.com)
    const legacyDataApi = nock('https://api.data.heroku.com')
    let pollingCalls = 0
    legacyDataApi
      .get(`/data/maintenances/v1/${nonPostgresAddon.id}`)
      .thrice()
      .reply(() => {
        pollingCalls++

        return pollingCalls === 3
          ? [200, completedMaintenance]
          : [200, runningMaintenance]
      })

    const {stderr} = await runCommand(DataMaintenancesWait, [nonPostgresAddon.name])

    expect(stderr).to.contain(`Waiting for maintenance on ${nonPostgresAddon.name} to complete`)
    expect(stderr).to.contain('maintenance completed')
    legacyDataApi.done()
  })
})
