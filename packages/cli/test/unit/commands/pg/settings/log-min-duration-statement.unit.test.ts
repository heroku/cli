import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand'
import Cmd from '../../../../../src/commands/pg/settings/log-min-duration-statement'
import * as fixtures from '../../../../fixtures/addons/fixtures'

describe('pg:settings:log-min-duration-statement', function () {
  const addon = fixtures.addons['dwh-db']

  beforeEach(function () {
    nock('https://api.heroku.com')
      .post('/actions/addons/resolve', {
        app: 'myapp',
        addon: 'test-database',
      }).reply(200, [addon])
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('shows settings for auto_explain with value', async function () {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {log_min_duration_statement: {value: 'test_value'}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      log-min-duration-statement is set to test_value for ${addon.name}.
      The duration of each completed statement will be logged if the statement ran for at least test_value milliseconds.
    `))
  })

  it('shows settings for auto_explain with value of -1', async function () {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {log_min_duration_statement: {value: -1}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      log-min-duration-statement is set to -1 for ${addon.name}.
      The duration of each completed statement will not be logged.
    `))
  })

  it('shows settings for auto_explain with value of 0', async function () {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {log_min_duration_statement: {value: 0}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
    log-min-duration-statement is set to 0 for ${addon.name}.
    The duration of each completed statement will be logged.
    `))
  })
})
