import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/settings/log-min-duration-statement.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

describe('pg:settings:log-min-duration-statement', function () {
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

  it('shows settings for auto_explain with value', async function () {
    fakeData.databaseSettings.get.resolves({addon, setting: {value: 'test_value'}})
    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
      log-min-duration-statement is set to test_value for ${addon.name}.
      The duration of each completed statement will be logged if the statement ran for at least test_value milliseconds.
    `))
  })

  it('shows settings for auto_explain with value of -1', async function () {
    fakeData.databaseSettings.get.resolves({addon, setting: {value: -1}})
    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
      log-min-duration-statement is set to -1 for ${addon.name}.
      The duration of each completed statement will not be logged.
    `))
  })

  it('shows settings for auto_explain with value of 0', async function () {
    fakeData.databaseSettings.get.resolves({addon, setting: {value: 0}})
    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
      log-min-duration-statement is set to 0 for ${addon.name}.
      The duration of each completed statement will be logged.
    `))
  })
})
