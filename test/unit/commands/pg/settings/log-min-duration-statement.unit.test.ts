import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand.js'
import Cmd from '../../../../../src/commands/pg/settings/log-min-duration-statement.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('pg:settings:log-min-duration-statement', function () {
  const addon = fixtures.addons['dwh-db']
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'test-database',
        addon_service: 'heroku-postgresql',
      })
      .reply(200, [{addon}])
  })

  afterEach(function () {
    api.done()
    pg.done()
    nock.cleanAll()
  })

  it('shows settings for auto_explain with value', async function () {
    pg = nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {log_min_duration_statement: {value: 'test_value'}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      log-min-duration-statement is set to test_value for ${addon.name}.
      The duration of each completed statement will be logged if the statement ran for at least test_value milliseconds.
    `))
  })

  it('shows settings for auto_explain with value of -1', async function () {
    pg = nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {log_min_duration_statement: {value: -1}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      log-min-duration-statement is set to -1 for ${addon.name}.
      The duration of each completed statement will not be logged.
    `))
  })

  it('shows settings for auto_explain with value of 0', async function () {
    pg = nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {log_min_duration_statement: {value: 0}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      log-min-duration-statement is set to 0 for ${addon.name}.
      The duration of each completed statement will be logged.
    `))
  })
})
