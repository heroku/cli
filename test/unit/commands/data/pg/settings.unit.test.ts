import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgSettings from '../../../../../src/commands/data/pg/settings.js'
import {
  addon,
  emptySettingsChangeResponse,
  nonAdvancedAddon,
  settingsGetResponse,
  settingsPutResponse,
} from '../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc.default

describe.only('data:pg:settings', function () {
  it('exits with error if it isn\'t a Advanced-tier database', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])

    try {
      await runCommand(DataPgSettings, [
        'my-addon',
        '--app=myapp',
      ])
    } catch (error: unknown) {
      const err = error as Error
      herokuApi.done()
      expect(err.message).to.equal(heredoc(`
        You can only use this command to configure settings on Advanced-tier databases.
        See https://devcenter.heroku.com/articles/heroku-postgres-settings to configure settings on non-Advanced-tier databases.
      `),
      )
    }
  })

  context('put', function () {
    it('shows no changes applied when no changes received', async function () {
      const herokuApi = nock('https://api.heroku.com').post('/actions/addons/resolve').reply(200, [addon])
      const dataApi = nock('https://api.data.heroku.com')
        .put(`/data/postgres/v1/${addon.id}/settings`)
        .reply(200, emptySettingsChangeResponse)

      await runCommand(DataPgSettings, [
        'my-addon',
        '--app=myapp',
        '--set=log_min_duration_statement:500',
      ])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')
      expect(stdout.output.trim()).to.include('Those settings are already applied to advanced-horizontal-01234.')
    })

    it('shows received changes', async function () {
      const herokuApi = nock('https://api.heroku.com').post('/actions/addons/resolve').reply(200, [addon])
      const dataApi = nock('https://api.data.heroku.com')
        .put(
          `/data/postgres/v1/${addon.id}/settings`,
          {settings: 'log_min_duration_statement:500,idle_in_transaction_session_timeout:864000'},
        )
        .reply(200, settingsPutResponse)

      await runCommand(DataPgSettings, [
        'my-addon',
        '--app=myapp',
        '--set=log_min_duration_statement:500',
        '--set=idle_in_transaction_session_timeout:864000',
      ])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')

      const actual = removeAllWhitespace(stdout.output)
      expect(actual).to.include(removeAllWhitespace('Updating these settings...'))
      expect(actual).to.include(removeAllWhitespace('log_min_duration_statement 550 500'))
      expect(actual).to.include(removeAllWhitespace('idle_in_transaction_session_timeout 80000 864000'))
      expect(actual).to.include(removeAllWhitespace('Updating your database advanced-horizontal-01234 shortly. You can use data:pg:info advanced-horizontal-01234 -a myapp to track progress'))
    })
  })

  context('get', function () {
    it('shows settings', async function () {
      const herokuApi = nock('https://api.heroku.com').post('/actions/addons/resolve').reply(200, [addon])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/settings`)
        .reply(200, settingsGetResponse)

      await runCommand(DataPgSettings, [
        'my-addon',
        '--app=myapp',
      ])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')

      const actual = removeAllWhitespace(stdout.output)
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
