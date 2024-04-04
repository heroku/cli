
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import Cmd from '../../../../../src/commands/pg/settings/log-lock-waits'
import runCommand from '../../../../helpers/runCommand'
import * as fixtures from '../../../../fixtures/addons/fixtures'
import expectOutput from '../../../../helpers/utils/expectOutput'
import * as nock from 'nock'

describe('pg:settings', () => {
  const addon = fixtures.addons['www-db']
  const attachment = {addon}

  beforeEach(() => {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'test-database',
        addon_service: 'heroku-postgresql',
      }).reply(200, [attachment])
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('shows settings for log_lock_waits with value', async () => {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200,
        {
          value: 'log_lock_waits',
          values: {
            test_value: 'foobar',
          },
        })

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'test-database',
      'true',
    ])
    expectOutput(stdout.output, heredoc(`
      log-lock-waits is set to test_value for postgres-1.
      When a deadlock is detected, a log message will be emitted in your application's logs.
    `))
  })

  it('shows settings for log_lock_waits with no value', async () => {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200,
        {
          value: 'log_lock_waits',
          values: {
            test_value: 'foobar',
          },
        })

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'test-database',
    ])
    expectOutput(stdout.output, heredoc(`
      log-lock-waits is set to  for postgres-1.
      When a deadlock is detected, no log message will be emitted in your application's logs.
    `))
  })
})
