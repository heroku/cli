import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import DataMaintenancesRun from '../../../../../src/commands/data/maintenances/run.js'
import {Maintenance, MaintenanceStatus} from '../../../../../src/lib/data/types.js'
import {cedarApp} from '../../../../fixtures/apps/fixtures.js'
import {maintenance, maintenancesResponse} from '../../../../fixtures/data/maintenances/fixtures.js'
import {addon, legacyEssentialAddon, nonPostgresAddon} from '../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../helpers/legacy-run-command.js'

const appInMaintenance = {
  ...cedarApp,
  maintenance: true,
}

describe('data:maintenances:run', function () {
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

  it('runs maintenance in window with app flag', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    herokuApi
      .get(`/apps/${addon.app.id}`)
      .reply(200, appInMaintenance)

    dataApi
      .post(`/data/maintenances/v1/${addon.id}/run`)
      .reply(200, maintenancesResponse)

    await runCommand(DataMaintenancesRun, [`--app=${appInMaintenance.name}`, addon.name])

    expect(stderr.output).to.contain('maintenance triggered')
    expect(stdout.output).to.contain('')
  })

  it('runs maintenance in window without app flag', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    herokuApi
      .get(`/apps/${addon.app.id}`)
      .reply(200, appInMaintenance)

    dataApi
      .post(`/data/maintenances/v1/${addon.id}/run`)
      .reply(200, maintenancesResponse)

    await runCommand(DataMaintenancesRun, [addon.name])

    expect(stderr.output).to.contain('maintenance triggered')
    expect(stdout.output).to.contain('')
  })

  it('runs maintenance for non-postgres add-ons', async function () {
    herokuApi
      .post('/actions/addons/resolve', body => body.addon_service === undefined)
      .reply(200, [nonPostgresAddon])

    herokuApi
      .get(`/apps/${nonPostgresAddon.app.id}`)
      .reply(200, appInMaintenance)

    dataApi
      .post(`/data/maintenances/v1/${nonPostgresAddon.id}/run`)
      .reply(200, maintenancesResponse)

    await runCommand(DataMaintenancesRun, [nonPostgresAddon.name])

    expect(stderr.output).to.contain('maintenance triggered')
    expect(stdout.output).to.contain('')
  })

  it('runs maintenance out of window with --confirm', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    herokuApi
      .get(`/apps/${addon.app.id}`)
      .reply(200, cedarApp)

    dataApi
      .post(`/data/maintenances/v1/${addon.id}/run`)
      .reply(200, maintenancesResponse)

    await runCommand(DataMaintenancesRun, [
      `--confirm=${cedarApp.name}`,
      `--app=${cedarApp.name}`,
      addon.name,
    ])

    expect(stderr.output).to.contain('maintenance triggered')
    expect(stdout.output).to.contain('')
  })

  it('shows an error trying to run maintenance out of window without --force', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    herokuApi
      .get(`/apps/${addon.app.id}`)
      .reply(200, cedarApp)

    try {
      await runCommand(DataMaintenancesRun, [`--app=${cedarApp.name}`, addon.name])
    } catch (error) {
      const {message} = error as {message: string}
      expect(ansis.strip(message)).to.equal('To proceed, put the application into maintenance mode or re-run the command with --confirm my-cedar-app')
    }
  })

  it('shows an error trying to run maintenance on an essential tier', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [legacyEssentialAddon])

    try {
      await runCommand(DataMaintenancesRun, [`--app=${appInMaintenance.name}`, legacyEssentialAddon.name])
    } catch (error) {
      const {message} = error as {message: string}
      expect(message).to.equal('You can\'t trigger maintenance on an Essential tier database.')
    }
  })

  it('waits until maintenance is complete when using wait flag', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    herokuApi
      .get(`/apps/${addon.app.id}`)
      .reply(200, appInMaintenance)

    // call maintenance
    dataApi
      .post(`/data/maintenances/v1/${addon.id}/run`)
      .reply(200, maintenancesResponse)

    // polling for maintenance status 3 times
    let pollingCalls = 0
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .thrice()
      .reply(() => {
        pollingCalls++

        const runningMaintenance: Maintenance = {
          ...maintenance,
          status: MaintenanceStatus.running,
        }

        const completedMaintenance: Maintenance = {
          ...maintenance,
          status: MaintenanceStatus.completed,
        }

        return pollingCalls === 3
          ? [200, completedMaintenance]
          : [200, runningMaintenance]
      })

    await runCommand(DataMaintenancesRun, [`--app=${appInMaintenance.name}`, '--wait', addon.name])

    expect(stderr.output).to.contain('maintenance triggered')
    expect(stderr.output).to.contain('maintenance completed')
    expect(stdout.output).to.equal('')
  })
})
