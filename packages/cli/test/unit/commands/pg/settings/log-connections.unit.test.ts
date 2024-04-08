import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand'
import Cmd from '../../../../../src/commands/pg/settings/log-connections'

describe('pg:settings:log-connections', () => {
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(() => {
    const addon = {
      id: 1,
      name: 'postgres-1',
      app: {name: 'myapp'},
      config_vars: ['READONLY_URL', 'DATABASE_URL', 'HEROKU_POSTGRESQL_RED_URL'],
      plan: {name: 'heroku-postgresql:standard-0'},
    }

    api = nock('https://api.heroku.com')
    api.post('/actions/addons/resolve', {
      app: 'myapp',
      addon: 'test-database',
    }).reply(200, [addon])

    pg = nock('https://api.data.heroku.com')
  })

  afterEach(() => {
    api.done()
    pg.done()
  })

  it('shows settings for auto_explain with value', async () => {
    pg.get('/postgres/v0/databases/1/config').reply(200, {log_connections: {value: 'test_value'}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
    log-connections is set to test_value for postgres-1.
    When login attempts are made, a log message will be emitted in your application's logs.
    `))
  })

  it('shows settings for auto_explain with no value', async () => {
    pg.get('/postgres/v0/databases/1/config').reply(200, {log_connections: {value: ''}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
    log-connections is set to  for postgres-1.
    When login attempts are made, no log message will be emitted in your application's logs.
    `))
  })
})
