import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/settings/data-connector-details-logs.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

describe('pg:data-connector-details-logs', function () {
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

  it('turns on data-connector-details-logs option', async function () {
    fakeData.databaseSettings.get.resolves({addon, setting: {value: 'on'}})
    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
      data-connector-details-logs is set to on for ${addon.name}.
      Data replication slot details will be logged.
    `))
  })

  it('turns off data-connector-details-logs option', async function () {
    fakeData.databaseSettings.get.resolves({addon, setting: {value: ''}})
    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
      data-connector-details-logs is set to  for ${addon.name}.
      Data replication slot details will no longer be logged.
    `))
  })
})
