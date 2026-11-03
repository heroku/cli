import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgSettings from '../../../../../src/commands/data/pg/settings.js'
import {
  addon,
  emptySettingsChangeResponse,
  nonAdvancedAddon,
  settingsGetResponse,
  settingsPutResponse,
} from '../../../../fixtures/data/pg/fixtures.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc

interface FakeData {
  postgresSettings: {info: SinonStub; update: SinonStub}
}

describe('data:pg:settings', function () {
  let fakeData: FakeData

  beforeEach(function () {
    fakeData = {postgresSettings: {info: stub(), update: stub()}}
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
  })

  afterEach(function () {
    restore()
  })

  it('exits with error if it isn\'t a Advanced-tier database', async function () {
    const notAdvanced = new NotAdvancedDatabaseError(nonAdvancedAddon, 'not advanced')
    fakeData.postgresSettings.info.rejects(notAdvanced)

    const {error} = await runCommand(DataPgSettings, [
      'my-addon',
      '--app=myapp',
    ])
    const err = error as Error
    expect(err.message).to.equal(heredoc(`
        You can only use this command to configure settings on Advanced-tier databases.
        See https://devcenter.heroku.com/articles/heroku-postgres-settings to configure settings on non-Advanced-tier databases.
      `))
  })

  context('put', function () {
    it('shows no changes applied when no changes received', async function () {
      fakeData.postgresSettings.update.resolves({addon, settings: emptySettingsChangeResponse})

      const {stderr, stdout} = await runCommand(DataPgSettings, [
        'my-addon',
        '--app=myapp',
        '--set=log_min_duration_statement:500',
      ])

      expect(stderr).to.equal('')
      expect(stdout.trim()).to.include('Those settings are already applied to advanced-horizontal-01234.')
      expect(fakeData.postgresSettings.update.calledOnceWithExactly('my-addon', {settings: 'log_min_duration_statement:500'}, {appIdentity: 'myapp'})).to.equal(true)
    })

    it('shows received changes', async function () {
      fakeData.postgresSettings.update.resolves({addon, settings: settingsPutResponse})

      const {stderr, stdout} = await runCommand(DataPgSettings, [
        'my-addon',
        '--app=myapp',
        '--set=log_min_duration_statement:500',
        '--set=idle_in_transaction_session_timeout:864000',
      ])

      expect(stderr).to.equal('')
      expect(fakeData.postgresSettings.update.calledOnceWithExactly(
        'my-addon',
        {settings: 'log_min_duration_statement:500,idle_in_transaction_session_timeout:864000'},
        {appIdentity: 'myapp'},
      )).to.equal(true)

      const actual = removeAllWhitespace(stdout)
      expect(actual).to.include(removeAllWhitespace('Updating these settings...'))
      expect(actual).to.include(removeAllWhitespace('log_min_duration_statement 550 500'))
      expect(actual).to.include(removeAllWhitespace('idle_in_transaction_session_timeout 80000 864000'))
      expect(actual).to.include(removeAllWhitespace('Updating your database advanced-horizontal-01234 shortly. You can use data:pg:info advanced-horizontal-01234 -a myapp to track progress'))
    })
  })

  context('get', function () {
    it('shows settings', async function () {
      fakeData.postgresSettings.info.resolves({addon, settings: settingsGetResponse})

      const {stderr, stdout} = await runCommand(DataPgSettings, [
        'my-addon',
        '--app=myapp',
      ])

      expect(stderr).to.equal('')
      expect(fakeData.postgresSettings.info.calledOnceWithExactly('my-addon', {appIdentity: 'myapp'})).to.equal(true)

      const actual = removeAllWhitespace(stdout)
      expect(actual).to.include(removeAllWhitespace('=== advanced-horizontal-01234'))
      expect(actual).to.include(removeAllWhitespace('Setting Value'))
      expect(actual).to.include(removeAllWhitespace('log_connections true'))
      expect(actual).to.include(removeAllWhitespace('log_lock_waits true'))
      expect(actual).to.include(removeAllWhitespace('log_min_duration_statement 500'))
      expect(actual).to.include(removeAllWhitespace('log_min_error_statement info'))
      expect(actual).to.include(removeAllWhitespace('log_statement ddl'))
      expect(actual).to.include(removeAllWhitespace('track_functions pl'))
      expect(actual).to.include(removeAllWhitespace('auto_explain.log_analyze'))
      expect(actual).to.include(removeAllWhitespace('auto_explain.log_buffers'))
      expect(actual).to.include(removeAllWhitespace('auto_explain.log_format'))
      expect(actual).to.include(removeAllWhitespace('auto_explain.log_min_duration'))
      expect(actual).to.include(removeAllWhitespace('auto_explain.log_nested_statements'))
      expect(actual).to.include(removeAllWhitespace('auto_explain.log_triggers'))
      expect(actual).to.include(removeAllWhitespace('auto_explain.log_verbose'))
    })
  })
})
