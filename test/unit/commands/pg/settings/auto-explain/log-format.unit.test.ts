import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-format.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

describe('pg:settings:auto-explain:log-format', function () {
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

  it('updates settings for auto_explain.log_format with value', async function () {
    fakeData.databaseSettings.update.resolves({addon, setting: {value: 'json'}})

    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database', 'json'])

    expect(stdout).to.equal(heredoc(`
      auto-explain.log-format has been set to json for ${addon.name}.
      Auto explain log output will log in json format.
    `))
  })
})
