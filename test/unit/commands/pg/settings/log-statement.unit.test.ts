import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/settings/log-statement.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

describe('pg:settings:log-statement', function () {
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

  it('shows settings for log_statements', async function () {
    fakeData.databaseSettings.get.resolves({
      addon, setting: {
        value: 'ddl',
        values: {
          ddl: "All data definition statements, such as CREATE, ALTER and DROP, will be logged in your application's logs.",
          none: "No statements will be logged in your application's logs..",
        },
      },
    })

    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
      log-statement is set to ddl for ${addon.name}.
      All data definition statements, such as CREATE, ALTER and DROP, will be logged in your application's logs.
    `))
  })
})
