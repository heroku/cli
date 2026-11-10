import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/settings/log-min-error-statement.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

describe('pg:settings:log-min-error-statement', function () {
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

  it('shows settings for log_min_error_statement', async function () {
    fakeData.databaseSettings.get.resolves({
      addon, setting: {
        default: 'error',
        desc: 'Specify the minimum severity level of SQL errors to be logged.',
        value: 'error',
        values: {
          error: 'Logs all ERROR, LOG, FATAL, and PANIC level messages. (Default)',
          fatal: 'Logs all FATAL and PANIC level messages.',
          log: 'Logs all LOG, FATAL, and PANIC level messages.',
          panic: 'Logs only PANIC level messages.',
        },
      },
    })

    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
      log-min-error-statement is set to error for ${addon.name}.
      Logs all ERROR, LOG, FATAL, and PANIC level messages. (Default)
    `))
  })
})
