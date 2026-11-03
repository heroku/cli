import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
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

interface FakePlatform {
  addOn: {resolve: SinonStub}
}

describe('data:pg:settings', function () {
  let fakeData: FakeData
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakeData = {postgresSettings: {info: stub(), update: stub()}}
    fakePlatform = {addOn: {resolve: stub()}}
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('exits with error if it isn\'t a Advanced-tier database', async function () {
    fakePlatform.addOn.resolve.resolves(nonAdvancedAddon)

    const {error} = await runCommand(DataPgSettings, [
      'my-addon',
      '--app=myapp',
    ])
    const err = error as Error
    expect(err.message).to.equal(heredoc(`
        You can only use this command to configure settings on Advanced-tier databases.
        See https://devcenter.heroku.com/articles/heroku-postgres-settings to configure settings on non-Advanced-tier databases.
      `))
    expect(fakeData.postgresSettings.info.called).to.equal(false)
    expect(fakeData.postgresSettings.update.called).to.equal(false)
  })

  context('put', function () {
    it('shows no changes applied when no changes received', async function () {
      fakePlatform.addOn.resolve.resolves(addon)
      fakeData.postgresSettings.update.resolves(emptySettingsChangeResponse)

      const {stderr, stdout} = await runCommand(DataPgSettings, [
        'my-addon',
        '--app=myapp',
        '--set=log_min_duration_statement:500',
      ])

      expect(stderr).to.equal('')
      expect(stdout.trim()).to.include('Those settings are already applied to advanced-horizontal-01234.')
      expect(fakeData.postgresSettings.update.calledOnceWithExactly(addon.id, {settings: 'log_min_duration_statement:500'})).to.equal(true)
    })

    it('shows received changes', async function () {
      fakePlatform.addOn.resolve.resolves(addon)
      fakeData.postgresSettings.update.resolves(settingsPutResponse)

      const {stderr, stdout} = await runCommand(DataPgSettings, [
        'my-addon',
        '--app=myapp',
        '--set=log_min_duration_statement:500',
        '--set=idle_in_transaction_session_timeout:864000',
      ])

      expect(stderr).to.equal('')
      expect(fakeData.postgresSettings.update.calledOnceWithExactly(
        addon.id,
        {settings: 'log_min_duration_statement:500,idle_in_transaction_session_timeout:864000'},
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
      fakePlatform.addOn.resolve.resolves(addon)
      fakeData.postgresSettings.info.resolves(settingsGetResponse)

      const {stderr, stdout} = await runCommand(DataPgSettings, [
        'my-addon',
        '--app=myapp',
      ])

      expect(stderr).to.equal('')
      expect(fakeData.postgresSettings.info.calledOnceWithExactly(addon.id)).to.equal(true)

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
