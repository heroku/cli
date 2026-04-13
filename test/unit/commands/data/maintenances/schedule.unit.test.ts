import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import DataMaintenancesSchedule from '../../../../../src/commands/data/maintenances/schedule.js'
import {maintenance, maintenancesResponse} from '../../../../fixtures/data/maintenances/fixtures.js'
import {addon, nonPostgresAddon} from '../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../helpers/legacy-run-command.js'

const unscheduledScheduleResponse = {
  ...maintenancesResponse,
  previously_scheduled_for: null,
}

describe('data:maintenances:schedule', function () {
  const app = {
    name: 'test-app',
  }

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

  it('schedules a maintenance for an addon which has maintenance already scheduled', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .post(`/data/maintenances/v1/${addon.id}/schedule`)
      .reply(200, maintenancesResponse)

    await runCommand(DataMaintenancesSchedule, [addon.name])

    expect(stderr.output).to.contain(`Scheduling maintenance for ${addon.name}... maintenance scheduled`)
    expect(stdout.output).to.contain(`Scheduled maintenance for ${addon.name} changed from ${maintenance.previously_scheduled_for} to ${maintenance.scheduled_for}`)
  })

  it('schedules a maintenance for an addon that does not have maintenance already scheduled', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .post(`/data/maintenances/v1/${addon.id}/schedule`)
      .reply(200, unscheduledScheduleResponse)

    await runCommand(DataMaintenancesSchedule, [addon.name])

    expect(stderr.output).to.contain(`Scheduling maintenance for ${addon.name}... maintenance scheduled`)
    expect(stdout.output).to.contain(`Maintenance for ${addon.name} scheduled for ${maintenance.scheduled_for}`)
  })

  it('schedules a maintenance for an addon scoped to an app', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .post(`/data/maintenances/v1/${addon.id}/schedule`)
      .reply(200, unscheduledScheduleResponse)

    await runCommand(DataMaintenancesSchedule, [addon.name, `--app=${app.name}`])

    expect(stderr.output).to.contain(`Scheduling maintenance for ${addon.name}... maintenance scheduled`)
  })

  it('schedules a maintenance for a specified number of weeks', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .post(`/data/maintenances/v1/${addon.id}/schedule`)
      .reply(200, maintenancesResponse)

    await runCommand(DataMaintenancesSchedule, [addon.name, '--weeks=4'])

    expect(stderr.output).to.contain(`Scheduling maintenance for ${addon.name}... maintenance scheduled`)
  })

  it('schedules maintenance for non-postgres add-ons', async function () {
    herokuApi
      .post('/actions/addons/resolve', body => body.addon_service === undefined)
      .reply(200, [nonPostgresAddon])
    dataApi
      .post(`/data/maintenances/v1/${nonPostgresAddon.id}/schedule`)
      .reply(200, unscheduledScheduleResponse)

    await runCommand(DataMaintenancesSchedule, [nonPostgresAddon.name])

    expect(stderr.output).to.contain(`Scheduling maintenance for ${nonPostgresAddon.name}... maintenance scheduled`)
  })

  it('schedules a maintenance for a specific week', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(200, maintenance)
    dataApi
      .post(`/data/maintenances/v1/${addon.id}/schedule`)
      .reply(200, maintenancesResponse)

    await runCommand(DataMaintenancesSchedule, [addon.name, '--week=2019-11-01'])

    expect(stderr.output).to.contain(`Scheduling maintenance for ${addon.name}... maintenance scheduled`)
  })
})
