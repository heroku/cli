import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import AutoExplain from '../../../../src/commands/pg/settings/auto-explain.js'
import AutoExplainLogAnalyze from '../../../../src/commands/pg/settings/auto-explain/log-analyze.js'
import AutoExplainLogBuffers from '../../../../src/commands/pg/settings/auto-explain/log-buffers.js'
import AutoExplainLogFormat from '../../../../src/commands/pg/settings/auto-explain/log-format.js'
import AutoExplainLogMinDuration from '../../../../src/commands/pg/settings/auto-explain/log-min-duration.js'
import AutoExplainLogNestedStatements from '../../../../src/commands/pg/settings/auto-explain/log-nested-statements.js'
import AutoExplainLogTriggers from '../../../../src/commands/pg/settings/auto-explain/log-triggers.js'
import AutoExplainLogVerbose from '../../../../src/commands/pg/settings/auto-explain/log-verbose.js'
import DataConnectorDetailsLogs from '../../../../src/commands/pg/settings/data-connector-details-logs.js'
import Index from '../../../../src/commands/pg/settings/index.js'
import LogConnections from '../../../../src/commands/pg/settings/log-connections.js'
import LogLockWaits from '../../../../src/commands/pg/settings/log-lock-waits.js'
import LogMinDurationStatement from '../../../../src/commands/pg/settings/log-min-duration-statement.js'
import LogMinErrorStatement from '../../../../src/commands/pg/settings/log-min-error-statement.js'
import LogStatement from '../../../../src/commands/pg/settings/log-statement.js'
import TrackFunctions from '../../../../src/commands/pg/settings/track-functions.js'

const addon = {
  app: {id: 'app-1', name: 'myapp'},
  id: 'addon-1',
  name: 'postgresql-shiny-12345',
  plan: {name: 'heroku-postgresql:standard-0'},
}

const essentialAddon = {...addon, plan: {name: 'heroku-postgresql:essential-0'}}

type Case = {
  arg: string
  Cmd: Parameters<typeof runCommand>[0]
  explain: string
  key: string
  sent: unknown
  values?: Record<string, string>
}

const cases: Case[] = [
  {
    arg: 'on', Cmd: AutoExplain, explain: 'Execution plans of queries will be logged for future connections.', key: 'auto_explain', sent: true,
  },
  {
    arg: 'true', Cmd: AutoExplainLogAnalyze, explain: 'EXPLAIN ANALYZE execution plans will be logged.', key: 'auto_explain.log_analyze', sent: true,
  },
  {
    arg: 'off', Cmd: AutoExplainLogBuffers, explain: 'Buffer statistics have been disabled for auto_explain.', key: 'auto_explain.log_buffers', sent: false,
  },
  {
    arg: 'yaml', Cmd: AutoExplainLogFormat, explain: 'Auto explain log output will log in yaml format.', key: 'auto_explain.log_format', sent: 'yaml',
  },
  {
    arg: '250', Cmd: AutoExplainLogMinDuration, explain: 'All execution plans will be logged for queries taking up to 250 milliseconds or more.', key: 'auto_explain.log_min_duration', sent: 250,
  },
  {
    arg: 'TRUE', Cmd: AutoExplainLogNestedStatements, explain: 'Nested statements will be included in execution plan logs.', key: 'auto_explain.log_nested_statements', sent: true,
  },
  {
    arg: 'false', Cmd: AutoExplainLogTriggers, explain: 'Trigger execution statistics have been disabled for auto-explain.', key: 'auto_explain.log_triggers', sent: false,
  },
  {
    arg: 'ON', Cmd: AutoExplainLogVerbose, explain: 'Verbose execution plan logging has been enabled for auto_explain.', key: 'auto_explain.log_verbose', sent: true,
  },
  {
    arg: 'on', Cmd: DataConnectorDetailsLogs, explain: 'Data replication slot details will be logged.', key: 'data_connector_details_logs', sent: true,
  },
  {
    arg: 'off', Cmd: LogConnections, explain: 'When login attempts are made, no log message will be emitted in your application\'s logs.', key: 'log_connections', sent: false,
  },
  {
    arg: 'on', Cmd: LogLockWaits, explain: 'When a deadlock is detected, a log message will be emitted in your application\'s logs.', key: 'log_lock_waits', sent: true,
  },
  {
    arg: '500', Cmd: LogMinDurationStatement, explain: 'The duration of each completed statement will be logged if the statement ran for at least 500 milliseconds.', key: 'log_min_duration_statement', sent: 500,
  },
  {
    arg: 'panic', Cmd: LogMinErrorStatement, explain: 'Only panic-level errors are logged.', key: 'log_min_error_statement', sent: 'panic', values: {error: 'Errors are logged.', panic: 'Only panic-level errors are logged.'},
  },
  {
    arg: 'mod', Cmd: LogStatement, explain: 'DDL and data-modifying statements are logged.', key: 'log_statement', sent: 'mod', values: {mod: 'DDL and data-modifying statements are logged.', none: 'No statements are logged.'},
  },
  {
    arg: 'pl', Cmd: TrackFunctions, explain: 'Procedural-language functions are tracked.', key: 'track_functions', sent: 'pl', values: {none: 'No functions are tracked.', pl: 'Procedural-language functions are tracked.'},
  },
]

function resolve(attachment: string, resolved = addon) {
  return nock('https://api.heroku.com')
    .post('/actions/addon-attachments/resolve', {addon_attachment: attachment, app: 'myapp'})
    .reply(200, [{addon: resolved}])
}

describe('pg:settings setter commands', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  for (const {arg, Cmd, explain, key, sent, values} of cases) {
    const name = key.replaceAll('_', '-')
    const setting = {
      default: null, desc: 'description', value: sent, ...(values && {values}),
    }

    describe(name, function () {
      it('shows the setting for the given database', async function () {
        const api = resolve('HEROKU_POSTGRESQL_RED')
        const pg = nock('https://api.data.heroku.com')
          .get(`/postgres/v0/databases/${addon.id}/config`)
          .reply(200, {[key]: setting})

        const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'HEROKU_POSTGRESQL_RED'])

        api.done()
        pg.done()
        expect(stdout).to.equal(`${name} is set to ${sent} for ${addon.name}.\n${explain}\n`)
      })

      it('shows the setting for DATABASE_URL when no database is given', async function () {
        const api = resolve('DATABASE_URL')
        const pg = nock('https://api.data.heroku.com')
          .get(`/postgres/v0/databases/${addon.id}/config`)
          .reply(200, {[key]: setting})

        const {stdout} = await runCommand(Cmd, ['--app', 'myapp'])

        api.done()
        pg.done()
        expect(stdout).to.equal(`${name} is set to ${sent} for ${addon.name}.\n${explain}\n`)
      })

      it(`sets the setting from '${arg}'`, async function () {
        const api = resolve('HEROKU_POSTGRESQL_RED')
        const pg = nock('https://api.data.heroku.com')
          .patch(`/postgres/v0/databases/${addon.id}/config`, {[key]: sent})
          .reply(200, {[key]: setting})

        const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'HEROKU_POSTGRESQL_RED', arg])

        api.done()
        pg.done()
        expect(stdout).to.equal(`${name} has been set to ${sent} for ${addon.name}.\n${explain}\n`)
      })

      it('rejects Essential-tier databases', async function () {
        const api = resolve('HEROKU_POSTGRESQL_RED', essentialAddon)

        const {error, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'HEROKU_POSTGRESQL_RED', arg])

        api.done()
        expect(stdout).to.equal('')
        expect(error?.message).to.equal('You can\'t perform this operation on Essential-tier databases.')
      })
    })
  }

  it('rejects an invalid boolean value without updating the setting', async function () {
    resolve('HEROKU_POSTGRESQL_RED')

    const {error, stdout} = await runCommand(LogLockWaits, ['--app', 'myapp', 'HEROKU_POSTGRESQL_RED', 'maybe'])

    expect(stdout).to.equal('')
    expect(error?.message).to.equal('Invalid value. Valid options are: a boolean value')
  })

  it('rejects an invalid numeric value without updating the setting', async function () {
    resolve('HEROKU_POSTGRESQL_RED')

    const {error, stdout} = await runCommand(AutoExplainLogMinDuration, ['--app', 'myapp', 'HEROKU_POSTGRESQL_RED', 'soon'])

    expect(stdout).to.equal('')
    expect(error?.message).to.equal('Invalid value. Valid options are: a numeric value')
  })
})

describe('pg:settings', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('shows every setting for DATABASE_URL when no database is given', async function () {
    const api = resolve('DATABASE_URL')
    const pg = nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`)
      .reply(200, {log_lock_waits: {value: true}, log_statement: {value: 'ddl'}})

    const {stdout} = await runCommand(Index, ['--app', 'myapp'])

    api.done()
    pg.done()
    expect(stdout).to.equal(`=== ${addon.name}\n\nlog-lock-waits: true\nlog-statement:  ddl\n`)
  })

  it('rejects Essential-tier databases', async function () {
    const api = resolve('HEROKU_POSTGRESQL_RED', essentialAddon)

    const {error, stdout} = await runCommand(Index, ['--app', 'myapp', 'HEROKU_POSTGRESQL_RED'])

    api.done()
    expect(stdout).to.equal('')
    expect(error?.message).to.equal('You can\'t perform this operation on Essential-tier databases.')
  })
})
