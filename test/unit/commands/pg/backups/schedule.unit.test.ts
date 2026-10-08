import {runCommand} from '@heroku-cli/test-utils'
import {NotFoundError} from '@heroku/heroku-fetch'
import ansis from 'ansis'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'

import Cmd from '../../../../../src/commands/pg/backups/schedule.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

type FakeData = {
  database: {describe: SinonStub}
  transferSchedule: {create: SinonStub}
}

function buildFakeData(): FakeData {
  return {
    database: {describe: stub()},
    transferSchedule: {create: stub()},
  }
}

describe('pg:backups:schedule', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  context('with correct arguments', function () {
    const continuousProtectionWarning = 'Logical backups of large databases are likely to fail.'

    beforeEach(function () {
      fakeData.transferSchedule.create.resolves({
        hour: '06',
        schedule_name: 'DATABASE_URL',
        timezone: 'America/New_York',
      })
    })

    it('schedules a backup', async function () {
      fakeData.database.describe.resolves({
        info: [
          {name: 'Continuous Protection', values: ['On']},
        ],
        name: 'postgres-1',
      })

      const {stderr, stdout} = await runCommand(Cmd, ['--at', '06:00 EDT', '--app', 'myapp'])

      expect(stdout).to.equal('')
      expect(stderr).to.include('Scheduling automatic daily backups of ⛁ postgres-1 at 06:00 America/New_York')
      expect(stderr).to.include('done')
      // eslint-disable-next-line unicorn/no-useless-undefined
      expect(fakeData.database.describe.calledOnceWithExactly('myapp', undefined)).to.equal(true)
      expect(fakeData.transferSchedule.create.calledOnceWithExactly('myapp', undefined, {
        hour: 6,
        timezone: 'America/New_York',
      })).to.equal(true)
    })

    it('warns user that logical backups are error prone if continuous protection is on', async function () {
      fakeData.database.describe.resolves({
        info: [
          {name: 'Continuous Protection', values: ['On']},
        ],
      })

      const {stderr} = await runCommand(Cmd, ['--at', '06:00 EDT', '--app', 'myapp'])

      expect(ansis.strip(stderr)).to.include(continuousProtectionWarning)
    })

    it('does not warn user that logical backups are error prone if continuous protection is off', async function () {
      fakeData.database.describe.resolves({
        info: [
          {name: 'Continuous Protection', values: ['Off']},
        ],
      })

      const {stderr} = await runCommand(Cmd, ['--at', '06:00 EDT', '--app', 'myapp'])

      expect(ansis.strip(stderr)).not.to.include(continuousProtectionWarning)
    })
  })

  it('errors when the scheduled time has an invalid hour value', async function () {
    const {error} = await runCommand(Cmd, ['--at', '24:00', '--app', 'myapp'])

    expect(error?.message).to.eq("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'")
    expect(error?.oclif?.exit).to.equal(1)
  })

  it('errors when the scheduled time has an invalid time zone value', async function () {
    const {error} = await runCommand(Cmd, ['--at', '01:00 New York', '--app', 'myapp'])

    expect(error?.message).to.eq("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'")
    expect(error?.oclif?.exit).to.equal(1)
  })

  it('errors when the scheduled time specifies minutes', async function () {
    const {error} = await runCommand(Cmd, ['--at', '06:15 EDT', '--app', 'myapp'])

    expect(error?.message).to.eq("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'")
    expect(error?.oclif?.exit).to.equal(1)
  })

  it('accepts an unrecognized time zone while parsing the schedule', async function () {
    fakeData.database.describe.resolves({info: []})
    fakeData.transferSchedule.create.rejects(new Error('Bad request.'))

    const {error} = await runCommand(Cmd, ['--at', '06:00 New_York', '--app', 'myapp'])

    expect(error?.message).to.contain('Bad request.')
    expect(fakeData.transferSchedule.create.calledOnceWithExactly('myapp', undefined, {
      hour: 6,
      timezone: 'New_York',
    })).to.equal(true)
  })

  it('errors when the API returns a NotFoundError', async function () {
    fakeData.database.describe.rejects(new NotFoundError({} as Response))

    const {error} = await runCommand(Cmd, ['DATABASE', '--at', '06:00 EDT', '--app', 'myapp'])
    expect(ansis.strip(error!.message)).to.equal('⛁ DATABASE is not yet provisioned.\nRun heroku addons:wait to wait until the db is provisioned.')
    expect(error?.oclif?.exit).to.equal(1)
    expect(fakeData.transferSchedule.create.called).to.equal(false)
  })
})
