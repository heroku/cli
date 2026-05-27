import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import DataMaintenancesWait from '../../../../../src/commands/data/maintenances/wait.js'
import {Maintenance, MaintenanceStatus} from '../../../../../src/lib/data/types.js'
import {maintenance} from '../../../../fixtures/data/maintenances/fixtures.js'
import {addon, nonPostgresAddon} from '../../../../fixtures/data/pg/fixtures.js'

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
  let dataApi: nock.Scope

  beforeEach(function () {
    herokuApi = nock('https://api.heroku.com')
    dataApi = nock('https://postgres-api.heroku.com')
  })

  afterEach(function () {
    herokuApi.done()
    dataApi.done()
    nock.cleanAll()
  })

  it('waits until maintenance is complete', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    // Initial info call via SDK (postgres-api.heroku.com)
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(200, runningMaintenance)

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
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    // Initial info call via SDK (postgres-api.heroku.com)
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(200, runningMaintenance)

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
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(200, completedMaintenance)

    const {error} = await runCommand(DataMaintenancesWait, [addon.name])
    const {message} = error as {message: string}
    expect(ansis.strip(message)).to.equal(`There currently isn't any maintenance in progress for ${addon.name}`)
  })

  it('waits for non-postgres add-ons', async function () {
    herokuApi
      .post('/actions/addons/resolve', body => body.addon_service === undefined)
      .reply(200, [nonPostgresAddon])

    // Initial info call via SDK (postgres-api.heroku.com)
    dataApi
      .get(`/data/maintenances/v1/${nonPostgresAddon.id}`)
      .reply(200, runningMaintenance)

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
