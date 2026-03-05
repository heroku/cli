import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr} from 'stdout-stderr'

import DataMaintenancesWait from '../../../../../src/commands/data/maintenances/wait.js'
import {Maintenance, MaintenanceStatus} from '../../../../../src/lib/data/types.js'
import {maintenance} from '../../../../fixtures/data/maintenances/fixtures.js'
import {addon} from '../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'

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
    dataApi = nock('https://api.data.heroku.com')
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

    let pollingCalls = 0
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(200, runningMaintenance)
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .thrice()
      .reply(() => {
        pollingCalls++

        return pollingCalls === 3
          ? [200, completedMaintenance]
          : [200, runningMaintenance]
      })

    await runCommand(DataMaintenancesWait, [addon.name])

    expect(stderr.output).to.contain(`Waiting for maintenance on ${addon.name} to complete`)
    expect(stderr.output).to.contain('maintenance completed')
  })

  it('waits until maintenance is complete scoped by optional app flag', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    let pollingCalls = 0
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(200, runningMaintenance)
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .thrice()
      .reply(() => {
        pollingCalls++

        return pollingCalls === 3
          ? [200, completedMaintenance]
          : [200, runningMaintenance]
      })

    await runCommand(DataMaintenancesWait, [addon.name, `--app=${addon.app.name}`])

    expect(stderr.output).to.contain(`Waiting for maintenance on ${addon.name} to complete`)
    expect(stderr.output).to.contain('maintenance completed')
  })

  it('shows error if initial maintenance state is not running', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(200, completedMaintenance)

    try {
      await runCommand(DataMaintenancesWait, [addon.name])
    } catch (error) {
      const {message} = error as {message: string}
      expect(ansis.strip(message)).to.equal(`There currently isn't any maintenance in progress for ${addon.name}`)
    }
  })
})
