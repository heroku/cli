import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {match, SinonStub, stub} from 'sinon'

import DataMaintenancesInfo from '../../../../../src/commands/data/maintenances/info.js'
import {advancedAddon, nonPostgresAddon} from '../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'
import {unwrap} from '../../../../helpers/utils/unwrap.js'

const app = {
  name: 'test-app',
}

const maintenance = {
  addon: {
    attachments: ['DATABASE_URL'],
    kind: 'heroku-postgresql',
    name: 'postgresql-sinuous-83720',
    plan: 'standard-0',
    uuid: '44c1a07e-e44f-46ee-8da5-5cd4a3049348',
    window: 'Thursdays 22:00 to Fridays 02:00 UTC',
  },
  app: {
    name: 'test-app',
    uuid: 'app-uuid-1234',
  },
  method: 'changeover',
  previously_scheduled_for: '2019-11-05 22:00:00 +0000',
  reason: 'routine_maintenance',
  required_by: '2019-11-12 17:57:01 +0000',
  scheduled_for: '2019-11-07 22:00:00 +0000',
  server_created_at: '2019-10-24 23:24:47 +0000',
  status: 'none',
  window: 'Thursdays 22:00 to Fridays 02:00 UTC',
}

type FakeData = {
  maintenance: {info: SinonStub}
}

function buildFakeData(): FakeData {
  return {maintenance: {info: stub()}}
}

function stubInfo(infoStub: SinonStub, maintenance: unknown, previewAddon: unknown = advancedAddon) {
  infoStub.callsFake(async (_addonIdentity: string, options: any) => {
    await options?.beforeInfo?.({addon: previewAddon})
    return {addon: previewAddon, maintenance}
  })
}

describe('data:maintenances:info', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
    stubInfo(fakeData.maintenance.info, maintenance)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows a maintenance for an addon in styled object format by default', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesInfo, [advancedAddon.name])

    expect(unwrap(stderr)).to.contain('Fetching maintenance for advanced-horizontal-01234... done\n')
    expect(stdout).to.equal(`method:                   changeover
previously_scheduled_for: 2019-11-05 22:00:00 +0000
reason:                   routine_maintenance
required_by:              2019-11-12 17:57:01 +0000
scheduled_for:            2019-11-07 22:00:00 +0000
server_created_at:        2019-10-24 23:24:47 +0000
status:                   none
window:                   Thursdays 22:00 to Fridays 02:00 UTC
app_name:                 test-app
addon_attachments:        DATABASE_URL
addon_kind:               heroku-postgresql
addon_name:               postgresql-sinuous-83720
addon_plan:               standard-0
addon_window:             Thursdays 22:00 to Fridays 02:00 UTC
`)
    expect(fakeData.maintenance.info.calledOnceWithExactly(
      advancedAddon.name,
      {appIdentity: undefined, beforeInfo: match.func},
    )).to.equal(true)
  })

  it('shows a maintenance for an addon with duration_seconds and generated approximate duration', async function () {
    stubInfo(fakeData.maintenance.info, {...maintenance, duration_seconds: 872.976_767})
    const {stderr, stdout} = await runCommand(DataMaintenancesInfo, [advancedAddon.name])

    expect(unwrap(stderr)).to.contain('Fetching maintenance for advanced-horizontal-01234... done\n')
    expect(stdout).to.equal(`method:                   changeover
previously_scheduled_for: 2019-11-05 22:00:00 +0000
reason:                   routine_maintenance
required_by:              2019-11-12 17:57:01 +0000
scheduled_for:            2019-11-07 22:00:00 +0000
server_created_at:        2019-10-24 23:24:47 +0000
status:                   none
window:                   Thursdays 22:00 to Fridays 02:00 UTC
duration_seconds:         872.976767
app_name:                 test-app
addon_attachments:        DATABASE_URL
addon_kind:               heroku-postgresql
addon_name:               postgresql-sinuous-83720
addon_plan:               standard-0
addon_window:             Thursdays 22:00 to Fridays 02:00 UTC
duration_approximate:     ~ 15 minutes
`)
  })

  it('shows a maintenance for an addon scoped by the app flag', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesInfo, [advancedAddon.name, `--app=${app.name}`])

    expect(unwrap(stderr)).to.contain('Fetching maintenance for advanced-horizontal-01234... done\n')
    expect(stdout).to.equal(`method:                   changeover
previously_scheduled_for: 2019-11-05 22:00:00 +0000
reason:                   routine_maintenance
required_by:              2019-11-12 17:57:01 +0000
scheduled_for:            2019-11-07 22:00:00 +0000
server_created_at:        2019-10-24 23:24:47 +0000
status:                   none
window:                   Thursdays 22:00 to Fridays 02:00 UTC
app_name:                 test-app
addon_attachments:        DATABASE_URL
addon_kind:               heroku-postgresql
addon_name:               postgresql-sinuous-83720
addon_plan:               standard-0
addon_window:             Thursdays 22:00 to Fridays 02:00 UTC
`)
    expect(fakeData.maintenance.info.calledOnceWithExactly(
      advancedAddon.name,
      {appIdentity: app.name, beforeInfo: match.func},
    )).to.equal(true)
  })

  it('shows a maintenance for an addon in json format', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesInfo, [advancedAddon.name, '--json'])

    expect(unwrap(stderr)).to.contain('Fetching maintenance for advanced-horizontal-01234... done\n')
    expect(JSON.parse(stdout)).to.deep.equal(maintenance)
  })

  it('shows 404 error when maintenance is not found', async function () {
    fakeData.maintenance.info.callsFake(async (_addonIdentity, options) => {
      await options?.beforeInfo?.({addon: advancedAddon})
      throw Object.assign(new Error('not found'), {statusCode: 404})
    })

    const {error} = await runCommand(DataMaintenancesInfo, [advancedAddon.name, `--app=${app.name}`])
    const {message} = error as {message: string}
    expect(message).to.equal('no maintenance found for this add-on')
  })

  it('propagates the raw error when the addon itself cannot be resolved', async function () {
    fakeData.maintenance.info.rejects({message: 'Couldn\'t find that addon.', statusCode: 404})

    const {error} = await runCommand(DataMaintenancesInfo, [advancedAddon.name])
    const {message} = error as {message: string}
    expect(message).to.equal('Couldn\'t find that addon.')
  })

  it('shows maintenance for non-postgres add-ons', async function () {
    stubInfo(fakeData.maintenance.info, maintenance, nonPostgresAddon)

    const {stderr, stdout} = await runCommand(DataMaintenancesInfo, [nonPostgresAddon.name, '--json'])

    expect(unwrap(stderr)).to.contain(`Fetching maintenance for ${nonPostgresAddon.name}... done\n`)
    expect(JSON.parse(stdout)).to.deep.equal(maintenance)
  })
})
