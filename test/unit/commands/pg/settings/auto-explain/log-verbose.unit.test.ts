import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-verbose.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

describe('pg:settings:auto-explain:log-verbose', function () {
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

  it('shows settings for auto_explain.log_verbose with value', async function () {
    fakeData.databaseSettings.get.resolves({addon, setting: {value: 'test_value'}})
    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
    auto-explain.log-verbose is set to test_value for ${addon.name}.
    Verbose execution plan logging has been enabled for auto_explain.
    `))
  })

  it('shows settings for auto_explain.log_verbose with no value', async function () {
    fakeData.databaseSettings.get.resolves({addon, setting: {value: ''}})
    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
    auto-explain.log-verbose is set to  for ${addon.name}.
    Verbose execution plan logging has been disabled for auto_explain.
    `))
  })
})
