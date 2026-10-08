import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/backups/schedules.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type FakeData = {
  transferSchedule: {list: SinonStub}
}

function buildFakeData(): FakeData {
  return {
    transferSchedule: {list: stub()},
  }
}

describe('pg:backups:schedules', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows empty message with no schedules', async function () {
    fakeData.transferSchedule.list.resolves([])

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp'])

    expect(stderr).to.include('Warning: No backup schedules found on ⬢ myapp')
    expect(stderr).to.include('Use heroku pg:backups:schedule to set one up')
    expect(fakeData.transferSchedule.list.calledOnceWithExactly('myapp')).to.equal(true)
  })

  it('shows schedule', async function () {
    fakeData.transferSchedule.list.resolves([
      {hour: 5, name: 'DATABASE_URL', timezone: 'UTC'},
    ])

    const {stdout} = await runCommand(Cmd, ['--app', 'myapp'])

    expectOutput(stdout, heredoc(`
      === Backup Schedules
      DATABASE_URL: daily at 5:00 UTC
    `))
  })
})
