import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/backups/unschedule.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type FakeData = {
  transferSchedule: {delete: SinonStub; list: SinonStub}
}

function buildFakeData(): FakeData {
  return {
    transferSchedule: {delete: stub(), list: stub()},
  }
}

describe('pg:backups:unschedule', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    fakeData.transferSchedule.list.resolves([{name: 'DATABASE_URL', uuid: '100-001'}])
    fakeData.transferSchedule.delete.resolves()

    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('unschedules a backup', async function () {
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp'])

    expectOutput(stdout, '')
    expectOutput(stderr, heredoc(`
      Unscheduling ⛁ DATABASE_URL daily backups... done
    `))
    expect(fakeData.transferSchedule.list.calledOnceWithExactly('myapp')).to.equal(true)
    expect(fakeData.transferSchedule.delete.calledOnceWithExactly('myapp', 'DATABASE_URL', '100-001')).to.equal(true)
  })

  it('unschedules a backup when a database arg is given', async function () {
    fakeData.transferSchedule.list.resolves([{name: 'OTHER_URL', uuid: '100-001'}])

    const {stderr, stdout} = await runCommand(Cmd, ['OTHER_URL', '--app', 'myapp'])

    expectOutput(stdout, '')
    expectOutput(stderr, heredoc(`
      Unscheduling ⛁ OTHER_URL daily backups... done
    `))
    expect(fakeData.transferSchedule.delete.calledOnceWithExactly('myapp', 'OTHER_URL', '100-001')).to.equal(true)
  })
})

describe('pg:backups:unschedule error state', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    fakeData.transferSchedule.list.resolves([
      {
        name: 'DATABASE_URL',
        uuid: '100-001',
      },
      {
        name: 'DATABASE_URL2',
        uuid: '100-002',
      },
    ])

    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('errors when multiple schedules are returned from API and no database arg is given', async function () {
    const appName = 'myapp'

    const {error} = await runCommand(Cmd, ['--app', appName])

    expect(ansis.strip(error!.message)).to.equal(`Specify schedule on ⬢ ${appName}. Existing schedules: ⛁ DATABASE_URL, ⛁ DATABASE_URL2`)
    expect(fakeData.transferSchedule.delete.called).to.equal(false)
  })

  it('errors when no schedules exist and no database arg is given', async function () {
    fakeData.transferSchedule.list.resolves([])

    const {error} = await runCommand(Cmd, ['--app', 'myapp'])

    expect(ansis.strip(error!.message)).to.equal('No schedules on ⬢ myapp')
    expect(fakeData.transferSchedule.delete.called).to.equal(false)
  })

  it('errors when no schedule matches the given database', async function () {
    fakeData.transferSchedule.list.resolves([{name: 'OTHER_URL', uuid: '100-001'}])

    const {error} = await runCommand(Cmd, ['DATABASE_URL', '--app', 'myapp'])

    expect(ansis.strip(error!.message)).to.equal('No daily backups found for ⛁ DATABASE_URL')
    expect(fakeData.transferSchedule.delete.called).to.equal(false)
  })
})
