import {expect} from '@oclif/test'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand.js'
// import Cmd from '../../../../../src/commands/pg/settings/log-lock-waits'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'

/*
describe('pg:settings:log-lock-waits', function () {
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
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {log_lock_waits: {value: 'test_value'}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      log-lock-waits is set to test_value for ${addon.name}.
      When a deadlock is detected, a log message will be emitted in your application's logs.
    `))
  })

  it('shows settings for auto_explain with no value', async function () {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {log_lock_waits: {value: ''}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      log-lock-waits is set to  for ${addon.name}.
      When a deadlock is detected, no log message will be emitted in your application's logs.
    `))
  })
})

*/
