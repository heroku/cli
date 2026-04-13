import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/settings/log-min-error-statement.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('pg:settings:log-min-error-statement', function () {
  const addon = fixtures.addons['dwh-db']
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'test-database',
        app: 'myapp',
      })
      .reply(200, [{addon}])
  })

  afterEach(function () {
    api.done()
    pg.done()
    nock.cleanAll()
  })

  it('shows settings for log_min_error_statement', async function () {
    pg = nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`)
      .reply(200, {
        log_min_error_statement: {
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

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
      log-min-error-statement is set to error for ${addon.name}.
      Logs all ERROR, LOG, FATAL, and PANIC level messages. (Default)
    `))
  })
})
