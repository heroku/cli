import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/settings/index.js'

const heredoc = tsheredoc.default

describe('pg:settings', function () {
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(function () {
    const addon = {
      app: {name: 'myapp'},
      id: 1,
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:standard-0'},
    }

    api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'postgres-1',
        app: 'myapp',
      }).reply(200, [{addon}])

    pg = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    api.done()
    pg.done()
    nock.cleanAll()
  })

  it('shows settings', async function () {
    pg.get('/postgres/v0/databases/1/config').reply(200, {log_statement: {value: 'none'}})

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'postgres-1'])

    expect(stdout).to.eq(heredoc`
      === postgres-1

      log-statement: none
    `)
  })

  it('lists settings in ascending alphabetical order', async function () {
    const unorderedSettings = {
      auto_explain: {value: false},
      'auto_explain.log_analyze': {value: false},
      'auto_explain.log_buffers': {value: false},
      'auto_explain.log_format': {value: 'text'},
      'auto_explain.log_min_duration': {value: -1},
      'auto_explain.log_nested_statements': {value: false},
      'auto_explain.log_triggers': {value: false},
      'auto_explain.log_verbose': {value: false},
      data_connector_details_logs: {value: false},
      log_connections: {value: true},
      log_lock_waits: {value: true},
      log_min_duration_statement: {value: 2000},
      log_min_error_statement: {value: 'error'},
      log_statement: {value: 'ddl'},
      pgbouncer_default_pool_size: {value: 150},
      pgbouncer_max_client_conn: {value: 10_000},
      pgbouncer_max_db_connections: {value: 150},
      track_functions: {value: 'none'},
    }

    pg.get('/postgres/v0/databases/1/config').reply(200, unorderedSettings)

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'postgres-1'])

    expect(stdout).to.eq(heredoc`
      === postgres-1

      auto-explain:                       false
      auto-explain.log-analyze:           false
      auto-explain.log-buffers:           false
      auto-explain.log-format:            text
      auto-explain.log-min-duration:      -1
      auto-explain.log-nested-statements: false
      auto-explain.log-triggers:          false
      auto-explain.log-verbose:           false
      data-connector-details-logs:        false
      log-connections:                    true
      log-lock-waits:                     true
      log-min-duration-statement:         2000
      log-min-error-statement:            error
      log-statement:                      ddl
      pgbouncer-default-pool-size:        150
      pgbouncer-max-client-conn:          10000
      pgbouncer-max-db-connections:       150
      track-functions:                    none
    `)
  })
})
