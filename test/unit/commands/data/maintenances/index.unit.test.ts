import {runCommand} from '@heroku-cli/test-utils'
import {MaintenanceInfoResult as Maintenance} from '@heroku/types/data'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'

import DataMaintenancesIndex from '../../../../../src/commands/data/maintenances/index.js'
import {type MockSDK, mockSDK} from '../../../../helpers/mock-sdk.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'
const appId = '30f93b8f-c592-4004-8d8a-3efb20395484'

const app = {
  id: appId,
  name: 'test-app',
}

const postgresAddonMaintenance: Maintenance = {
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
  previously_scheduled_for: '2019-11-05 22:00:00 +0000',
  reason: 'routine_maintenance',
  required_by: '2019-11-12 17:57:01 +0000',
  scheduled_for: '2019-11-07 22:00:00 +0000',
  server_created_at: '2019-10-24 23:24:47 +0000',
  started_at: null,
  status: 'none',
  window: 'Thursdays 22:00 to Fridays 02:00 UTC',
}

const redisAddonMaintenance: Maintenance = {
  addon: {
    attachments: ['REDIS_URL'],
    kind: 'heroku-redis',
    name: 'redis-contoured-23719',
    plan: 'premium-0',
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
  scheduled_for: null,
  server_created_at: '2019-10-24 23:24:47 +0000',
  started_at: null,
  status: 'preparing',
  window: 'Thursdays 22:00 to Fridays 02:00 UTC',
}

const maintenances = [redisAddonMaintenance, postgresAddonMaintenance]

type FakeData = {
  maintenance: {infoByApp: SinonStub}
}

type FakePlatform = {
  app: {info: SinonStub}
}

function buildFakeData(): FakeData {
  return {maintenance: {infoByApp: stub()}}
}

function buildFakePlatform(): FakePlatform {
  return {app: {info: stub()}}
}

describe('data:maintenances', function () {
  let fakeData: FakeData
  let fakePlatform: FakePlatform
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    fakePlatform = buildFakePlatform()
    sdkMock = mockSDK(fakeData, fakePlatform)
    fakePlatform.app.info.resolves(app)
    fakeData.maintenance.infoByApp.resolves({maintenances})
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows a list of maintenances for a given app', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesIndex, ['--app=test-app'])
    const actualStdout = removeAllWhitespace(stdout)

    expect(stderr).to.contain('Fetching maintenances... done')
    expect(actualStdout).to.contain(removeAllWhitespace('Addon                      Attachments    Scheduling Window                      Status    Required by                 Scheduled for'))
    expect(actualStdout).to.contain(removeAllWhitespace('redis-contoured-23719      REDIS_URL      Thursdays 22:00 to Fridays 02:00 UTC   preparing   -                           -'))
    expect(actualStdout).to.contain(removeAllWhitespace('postgresql-sinuous-83720   DATABASE_URL   Thursdays 22:00 to Fridays 02:00 UTC   none      2019-11-12 17:57:01 +0000   2019-11-07 22:00:00 +0000'))
    expect(fakePlatform.app.info.calledOnceWithExactly(app.name)).to.equal(true)
    expect(fakeData.maintenance.infoByApp.calledOnceWithExactly(appId)).to.equal(true)
  })

  it('includes extended columns', async function () {
    const {stdout} = await runCommand(DataMaintenancesIndex, ['--app=test-app', '--extended', '--sort=Addon'])
    const actualStdout = removeAllWhitespace(stdout)

    expect(actualStdout).to.contain(removeAllWhitespace('Addon                      Attachments    Scheduling Window                      Status    Required by                 Scheduled for               Kind                Plan'))
    expect(actualStdout).to.contain(removeAllWhitespace('postgresql-sinuous-83720   DATABASE_URL   Thursdays 22:00 to Fridays 02:00 UTC   none      2019-11-12 17:57:01 +0000   2019-11-07 22:00:00 +0000   heroku-postgresql   standard-0'))
  })

  it('only includes specified columns', async function () {
    const {stdout} = await runCommand(DataMaintenancesIndex, ['--app=test-app', '--extended', '--columns=addon,attachments'])
    const actualStdout = removeAllWhitespace(stdout)

    expect(actualStdout).to.contain(removeAllWhitespace('Addon                      Attachments'))
    expect(actualStdout).to.contain(removeAllWhitespace('postgresql-sinuous-83720   DATABASE_URL'))
  })

  it('shows a list of maintenances for a given app with the json flag', async function () {
    const {stderr, stdout} = await runCommand(DataMaintenancesIndex, ['--app=test-app', '--json'])

    expect(stderr).to.contain('Fetching maintenances... done')
    expect(JSON.parse(stdout)).to.deep.equal(maintenances)
  })

  it('shows an error if the app is not found', async function () {
    const requestError = new Error('Couldn\'t find that app.')
    fakePlatform.app.info.rejects(requestError)

    const {error} = await runCommand(DataMaintenancesIndex, ['--app=test-app'])

    expect(error).to.equal(requestError)
    expect(fakeData.maintenance.infoByApp.called).to.equal(false)
  })

  it('shows an error message if there are no maintenances', async function () {
    fakeData.maintenance.infoByApp.resolves({maintenances: []})

    const {error} = await runCommand(DataMaintenancesIndex, ['--app=test-app'])
    const {message} = error as {message: string}
    expect(message).to.equal('No maintenances found for app test-app')
  })
})
