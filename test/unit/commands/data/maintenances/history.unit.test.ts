import {runCommand} from '@heroku-cli/test-utils'
import {MaintenanceHistoryResult} from '@heroku/types/data'
import {expect} from 'chai'
import {match, SinonStub, stub} from 'sinon'

import DataMaintenancesHistory from '../../../../../src/commands/data/maintenances/history.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'
import {unwrap} from '../../../../helpers/utils/unwrap.js'

const addonFixture = {
  id: 'b8966596-d1af-4f39-8c72-a8b4d6a5d3e1',
  name: 'postgresql-sinuous-83720',
}

type Maintenance = MaintenanceHistoryResult['maintenances'][number]

const maintenancesFixture: Maintenance[] = [
  {
    addon: {
      attachments: ['DATABASE_URL'],
      kind: 'heroku-postgresql',
      name: 'postgresql-sinuous-83720',
      plan: 'standard-0',
      uuid: 'addon-123',
      window: 'Thursdays 22:00 to Fridays 02:00 UTC',
    },
    app: {
      name: 'test-app',
      uuid: 'app-456',
    },
    completed_at: null,
    duration_seconds: null,
    method: 'changeover',
    previously_scheduled_for: null,
    reason: 'hardware_issue',
    required_by: null,
    scheduled_for: null,
    server_created_at: '2019-10-24 23:24:47 +0000',
    started_at: null,
    status: 'preparing',
    window: 'Thursdays 22:00 to Fridays 02:00 UTC',
  },
  {
    addon: {
      attachments: ['DATABASE_URL'],
      kind: 'heroku-postgresql',
      name: 'postgresql-sinuous-83720',
      plan: 'standard-0',
      uuid: 'addon-456',
      window: 'Thursdays 22:00 to Fridays 02:00 UTC',
    },
    app: {
      name: 'test-app',
      uuid: 'app-789',
    },
    completed_at: null,
    duration_seconds: null,
    method: 'changeover',
    previously_scheduled_for: null,
    reason: 'routine_maintenance',
    required_by: null,
    scheduled_for: '2019-11-07 22:00:00 +0000',
    server_created_at: '2019-10-24 23:24:47 +0000',
    started_at: null,
    status: 'none',
    window: 'Thursdays 22:00 to Fridays 02:00 UTC',
  },
]

type FakeData = {
  maintenance: {history: SinonStub}
}

function buildFakeData(): FakeData {
  return {maintenance: {history: stub()}}
}

function stubHistory(historyStub: SinonStub, maintenances: typeof maintenancesFixture) {
  historyStub.callsFake(async (_addonIdentity, _query, options) => {
    await options?.beforeHistory?.({addon: addonFixture})
    return {addon: addonFixture, history: {maintenances}}
  })
}

describe('data:maintenances:history', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
    stubHistory(fakeData.maintenance.history, maintenancesFixture)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows a list of maintenances for addon', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesHistory, [addonFixture.name])
    const actualStdout = removeAllWhitespace(stdout)

    expect(unwrap(stderr)).to.contain('Fetching maintenance history for postgresql-sinuous-83720... done')
    expect(actualStdout).to.contain(removeAllWhitespace('Scheduled for               Started at   Completed at   Duration (seconds)   Reason                Status    Window'))
    expect(actualStdout).to.contain(removeAllWhitespace('-                           -            -              -                    hardware_issue        preparing   Thursdays 22:00 to Fridays 02:00 UTC'))
    expect(actualStdout).to.contain(removeAllWhitespace('2019-11-07 22:00:00 +0000   -            -              -                    routine_maintenance   none      Thursdays 22:00 to Fridays 02:00 UTC'))
    expect(fakeData.maintenance.history.calledOnceWithExactly(
      addonFixture.name,
      {limit: 5},
      {appIdentity: undefined, beforeHistory: match.func},
    )).to.be.true
  })

  it('shows a list of maintenances for addons with only the specified columns', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesHistory, [addonFixture.name, '--columns=scheduled_for,started_at'])
    const actualStdout = removeAllWhitespace(stdout)

    expect(unwrap(stderr)).to.contain('Fetching maintenance history for postgresql-sinuous-83720... done')
    expect(actualStdout).to.contain(removeAllWhitespace('Scheduled for               Started at'))
    expect(actualStdout).to.contain(removeAllWhitespace('-                           -'))
    expect(actualStdout).to.contain(removeAllWhitespace('2019-11-07 22:00:00 +0000   -'))
    expect(actualStdout).to.not.contain(removeAllWhitespace('Completed at'))
  })

  it('shows a list of maintenances for addon capped at the number specified by the num flag', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesHistory, [addonFixture.name, '--num=1'])
    const actualStdout = removeAllWhitespace(stdout)

    expect(unwrap(stderr)).to.contain('Fetching maintenance history for postgresql-sinuous-83720... done')
    expect(actualStdout).to.contain(removeAllWhitespace('Scheduled for   Started at   Completed at   Duration (seconds)   Reason           Status    Window'))
    expect(actualStdout).to.contain(removeAllWhitespace('-               -            -              -                    hardware_issue   preparing   Thursdays 22:00 to Fridays 02:00 UTC'))
    expect(fakeData.maintenance.history.calledOnceWithExactly(
      addonFixture.name,
      {limit: 1},
      {appIdentity: undefined, beforeHistory: match.func},
    )).to.be.true
  })

  it('shows maintenances for addon formatted in json', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesHistory, [addonFixture.name, '--json'])

    expect(unwrap(stderr)).to.contain('Fetching maintenance history for postgresql-sinuous-83720... done')
    expect(JSON.parse(stdout)).to.deep.equal(maintenancesFixture)
  })

  it('shows a message when there are no maintenances for an addon', async function () {
    stubHistory(fakeData.maintenance.history, [])

    const {stdout} = await runCommand(DataMaintenancesHistory, [addonFixture.name, '--json'])

    expect(stdout).to.equal('postgresql-sinuous-83720 does not have any maintenance history\n')
  })
})
