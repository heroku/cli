import {runCommand} from '@heroku-cli/test-utils'
import {MaintenanceInfoResult as Maintenance} from '@heroku/types/data'
import ansis from 'ansis'
import {expect} from 'chai'
import {match, SinonStub, stub} from 'sinon'

import DataMaintenancesWait from '../../../../../src/commands/data/maintenances/wait.js'
import {maintenance} from '../../../../fixtures/data/maintenances/fixtures.js'
import {advancedAddon, nonPostgresAddon} from '../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const completedMaintenance: Maintenance = {
  ...maintenance,
  status: 'completed',
}

type FakeData = {
  maintenance: {wait: SinonStub}
}

function buildFakeData(): FakeData {
  return {maintenance: {wait: stub()}}
}

function stubWait(waitStub: SinonStub, previewAddon: unknown = advancedAddon) {
  waitStub.callsFake(async (_addonIdentity, options) => {
    await options?.beforeWait?.({addon: previewAddon})
    return completedMaintenance
  })
}

describe('data:maintenances:wait', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
    stubWait(fakeData.maintenance.wait)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('waits until maintenance is complete', async function () {
    const {stderr} = await runCommand(DataMaintenancesWait, [advancedAddon.name])

    expect(stderr).to.contain(`Waiting for maintenance on ${advancedAddon.name} to complete`)
    expect(stderr).to.contain('maintenance completed')
    expect(fakeData.maintenance.wait.calledOnceWithExactly(
      advancedAddon.name,
      {appIdentity: undefined, beforeWait: match.func},
    )).to.be.true
  })

  it('waits until maintenance is complete scoped by optional app flag', async function () {
    const {stderr} = await runCommand(DataMaintenancesWait, [advancedAddon.name, `--app=${advancedAddon.app.name}`])

    expect(stderr).to.contain(`Waiting for maintenance on ${advancedAddon.name} to complete`)
    expect(stderr).to.contain('maintenance completed')
    expect(fakeData.maintenance.wait.calledOnceWithExactly(
      advancedAddon.name,
      {appIdentity: advancedAddon.app.name, beforeWait: match.func},
    )).to.be.true
  })

  it('shows error if initial maintenance state is not running', async function () {
    fakeData.maintenance.wait.rejects(new Error(`There currently isn't any maintenance in progress for ${advancedAddon.name}`))

    const {error} = await runCommand(DataMaintenancesWait, [advancedAddon.name])
    const {message} = error as {message: string}
    expect(ansis.strip(message)).to.equal(`There currently isn't any maintenance in progress for ${advancedAddon.name}`)
  })

  it('waits for non-postgres add-ons', async function () {
    stubWait(fakeData.maintenance.wait, nonPostgresAddon)

    const {stderr} = await runCommand(DataMaintenancesWait, [nonPostgresAddon.name])

    expect(stderr).to.contain(`Waiting for maintenance on ${nonPostgresAddon.name} to complete`)
    expect(stderr).to.contain('maintenance completed')
  })
})
