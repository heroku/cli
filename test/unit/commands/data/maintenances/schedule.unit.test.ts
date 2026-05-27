import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {stub} from 'sinon'

import DataMaintenancesSchedule from '../../../../../src/commands/data/maintenances/schedule.js'
import {maintenance, maintenancesResponse} from '../../../../fixtures/data/maintenances/fixtures.js'
import {addon, nonPostgresAddon} from '../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const unscheduledScheduleResponse = {
  ...maintenancesResponse,
  previously_scheduled_for: null,
}

describe('data:maintenances:schedule', function () {
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

  it('schedules a maintenance for an addon which has maintenance already scheduled', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const scheduleStub = stub().resolves(maintenancesResponse)
    sdkMock = mockSDKData({maintenance: {schedule: scheduleStub}})

    const {stderr, stdout} = await runCommand(DataMaintenancesSchedule, [addon.name])

    expect(stderr).to.contain(`Scheduling maintenance for ${addon.name}... maintenance scheduled`)
    expect(stdout).to.contain(`Scheduled maintenance for ${addon.name} changed from ${maintenance.previously_scheduled_for} to ${maintenance.scheduled_for}`)
  })

  it('schedules a maintenance for an addon that does not have maintenance already scheduled', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const scheduleStub = stub().resolves(unscheduledScheduleResponse)
    sdkMock = mockSDKData({maintenance: {schedule: scheduleStub}})

    const {stderr, stdout} = await runCommand(DataMaintenancesSchedule, [addon.name])

    expect(stderr).to.contain(`Scheduling maintenance for ${addon.name}... maintenance scheduled`)
    expect(stdout).to.contain(`Maintenance for ${addon.name} scheduled for ${maintenance.scheduled_for}`)
  })

  it('schedules a maintenance for an addon scoped to an app', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const scheduleStub = stub().resolves(unscheduledScheduleResponse)
    sdkMock = mockSDKData({maintenance: {schedule: scheduleStub}})

    const {stderr} = await runCommand(DataMaintenancesSchedule, [addon.name, `--app=${app.name}`])

    expect(stderr).to.contain(`Scheduling maintenance for ${addon.name}... maintenance scheduled`)
  })

  it('schedules a maintenance for a specified number of weeks', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const scheduleStub = stub().resolves(maintenancesResponse)
    sdkMock = mockSDKData({maintenance: {schedule: scheduleStub}})

    const {stderr} = await runCommand(DataMaintenancesSchedule, [addon.name, '--weeks=4'])

    expect(stderr).to.contain(`Scheduling maintenance for ${addon.name}... maintenance scheduled`)
  })

  it('schedules maintenance for non-postgres add-ons', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve', body => body.addon_service === undefined)
      .reply(200, [nonPostgresAddon])

    const scheduleStub = stub().resolves(unscheduledScheduleResponse)
    sdkMock = mockSDKData({maintenance: {schedule: scheduleStub}})

    const {stderr} = await runCommand(DataMaintenancesSchedule, [nonPostgresAddon.name])

    expect(stderr).to.contain(`Scheduling maintenance for ${nonPostgresAddon.name}... maintenance scheduled`)
  })

  it('schedules a maintenance for a specific week', async function () {
    herokuApi = nock('https://api.heroku.com')
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const infoStub = stub().resolves(maintenance)
    const scheduleStub = stub().resolves(maintenancesResponse)
    sdkMock = mockSDKData({maintenance: {info: infoStub, schedule: scheduleStub}})

    const {stderr} = await runCommand(DataMaintenancesSchedule, [addon.name, '--week=2019-11-01'])

    expect(stderr).to.contain(`Scheduling maintenance for ${addon.name}... maintenance scheduled`)
  })
})
