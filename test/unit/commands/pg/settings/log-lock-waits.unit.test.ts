import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/settings/log-lock-waits.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

describe('pg:settings:log-lock-waits', function () {
  const addon = {id: 'addon-1', name: 'postgresql-shiny-12345'}
  let fakeData: {databaseSettings: {get: SinonStub; update: SinonStub}}
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = {databaseSettings: {get: stub(), update: stub()}}
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows settings for log-lock-waits with value', async function () {
    fakeData.databaseSettings.get.resolves({addon, setting: {value: 'test_value'}})
    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
      log-lock-waits is set to test_value for ${addon.name}.
      When a deadlock is detected, a log message will be emitted in your application's logs.
    `))
  })

  it('shows settings for log-lock-waits with no value', async function () {
    fakeData.databaseSettings.get.resolves({addon, setting: {value: ''}})
    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
      log-lock-waits is set to  for ${addon.name}.
      When a deadlock is detected, no log message will be emitted in your application's logs.
    `))
  })
})
