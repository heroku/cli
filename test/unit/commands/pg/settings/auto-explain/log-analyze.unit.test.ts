import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-analyze.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

describe('pg:settings:auto-explain:log-analyze', function () {
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

  it('updates settings for auto_explain.log_analyze with value', async function () {
    fakeData.databaseSettings.update.resolves({addon, setting: {value: true}})

    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database', 'true'])

    expect(stdout).to.equal(heredoc(`
      auto-explain.log-analyze has been set to true for ${addon.name}.
      EXPLAIN ANALYZE execution plans will be logged.
    `))
  })

  it('shows settings for auto_explain.log_analyze with no value', async function () {
    fakeData.databaseSettings.get.resolves({addon, setting: {value: false}})

    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])

    expect(stdout).to.equal(heredoc(`
      auto-explain.log-analyze is set to false for ${addon.name}.
      EXPLAIN ANALYZE execution plans will not be logged.
    `))
  })
})
