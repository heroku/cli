import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {match, SinonStub, stub} from 'sinon'

import DataMaintenancesSchedule from '../../../../../src/commands/data/maintenances/schedule.js'
import {maintenance, maintenancesResponse} from '../../../../fixtures/data/maintenances/fixtures.js'
import {advancedAddon, nonPostgresAddon} from '../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const unscheduledScheduleResponse = {
  ...maintenancesResponse,
  previously_scheduled_for: null,
}

type FakeData = {
  maintenance: {info: SinonStub; schedule: SinonStub}
}

function buildFakeData(): FakeData {
  return {maintenance: {info: stub(), schedule: stub()}}
}

function stubSchedule(scheduleStub: SinonStub, schedule: unknown, previewAddon: unknown = advancedAddon) {
  scheduleStub.callsFake(async (_addonIdentity, _body, options) => {
    await options?.beforeSchedule?.({addon: previewAddon})
    return {addon: previewAddon, schedule}
  })
}

describe('data:maintenances:schedule', function () {
  const app = {
    name: 'test-app',
  }

  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('schedules a maintenance for an addon which has maintenance already scheduled', async function () {
    stubSchedule(fakeData.maintenance.schedule, maintenancesResponse)

    const {stderr, stdout} = await runCommand(DataMaintenancesSchedule, [advancedAddon.name])

    expect(stderr).to.contain(`Scheduling maintenance for ${advancedAddon.name}... maintenance scheduled`)
    expect(stdout).to.contain(`Scheduled maintenance for ${advancedAddon.name} changed from ${maintenance.previously_scheduled_for} to ${maintenance.scheduled_for}`)
    expect(fakeData.maintenance.schedule.calledOnceWithExactly(
      advancedAddon.name,
      {delay_weeks: 2},
      {appIdentity: undefined, beforeSchedule: match.func},
    )).to.equal(true)
  })

  it('schedules a maintenance for an addon that does not have maintenance already scheduled', async function () {
    stubSchedule(fakeData.maintenance.schedule, unscheduledScheduleResponse)

    const {stderr, stdout} = await runCommand(DataMaintenancesSchedule, [advancedAddon.name])

    expect(stderr).to.contain(`Scheduling maintenance for ${advancedAddon.name}... maintenance scheduled`)
    expect(stdout).to.contain(`Maintenance for ${advancedAddon.name} scheduled for ${maintenance.scheduled_for}`)
  })

  it('schedules a maintenance for an addon scoped to an app', async function () {
    stubSchedule(fakeData.maintenance.schedule, unscheduledScheduleResponse)

    const {stderr} = await runCommand(DataMaintenancesSchedule, [advancedAddon.name, `--app=${app.name}`])

    expect(stderr).to.contain(`Scheduling maintenance for ${advancedAddon.name}... maintenance scheduled`)
    expect(fakeData.maintenance.schedule.calledOnceWithExactly(
      advancedAddon.name,
      {delay_weeks: 2},
      {appIdentity: app.name, beforeSchedule: match.func},
    )).to.equal(true)
  })

  it('schedules a maintenance for a specified number of weeks', async function () {
    stubSchedule(fakeData.maintenance.schedule, maintenancesResponse)

    const {stderr} = await runCommand(DataMaintenancesSchedule, [advancedAddon.name, '--weeks=4'])

    expect(stderr).to.contain(`Scheduling maintenance for ${advancedAddon.name}... maintenance scheduled`)
    expect(fakeData.maintenance.schedule.calledOnceWithExactly(
      advancedAddon.name,
      {delay_weeks: 4},
      {appIdentity: undefined, beforeSchedule: match.func},
    )).to.equal(true)
  })

  it('schedules maintenance for non-postgres add-ons', async function () {
    stubSchedule(fakeData.maintenance.schedule, unscheduledScheduleResponse, nonPostgresAddon)

    const {stderr} = await runCommand(DataMaintenancesSchedule, [nonPostgresAddon.name])

    expect(stderr).to.contain(`Scheduling maintenance for ${nonPostgresAddon.name}... maintenance scheduled`)
  })

  it('schedules a maintenance for a specific week', async function () {
    fakeData.maintenance.info.resolves({addon: advancedAddon, maintenance})
    stubSchedule(fakeData.maintenance.schedule, maintenancesResponse)

    const {stderr} = await runCommand(DataMaintenancesSchedule, [advancedAddon.name, '--week=2019-11-01'])

    expect(stderr).to.contain(`Scheduling maintenance for ${advancedAddon.name}... maintenance scheduled`)
    expect(fakeData.maintenance.schedule.calledOnceWithExactly(
      advancedAddon.name,
      {delay_weeks: -1},
      {appIdentity: undefined, beforeSchedule: match.func},
    )).to.equal(true)
    expect(fakeData.maintenance.info.calledOnceWithExactly(
      advancedAddon.name,
      {appIdentity: undefined},
    )).to.equal(true)
  })
})
