import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand'
import Cmd from '../../../../../src/commands/pg/settings/log-min-error-statement'
import * as fixtures from '../../../../fixtures/addons/fixtures'

describe('pg:settings:log-min-error-statement', function () {
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

  it('shows settings for log_min_error_statement', async function () {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`)
      .reply(200, {
        log_min_error_statement: {
          value: 'error',
          desc: 'Specify the minimum severity level of SQL errors to be logged.',
          default: 'error',
          values: {
            error: 'Logs all ERROR, LOG, FATAL, and PANIC level messages. (Default)',
            log: 'Logs all LOG, FATAL, and PANIC level messages.',
            fatal: 'Logs all FATAL and PANIC level messages.',
            panic: 'Logs only PANIC level messages.',
          },
        },
      })

    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      log-min-error-statement is set to error for ${addon.name}.
      Logs all ERROR, LOG, FATAL, and PANIC level messages. (Default)
    `))
  })
})
