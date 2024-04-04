import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../../helpers/runCommand'
import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-buffers'
import * as fixtures from '../../../../../fixtures/addons/fixtures'

describe('pg:settings:auto-explain:log-buffers', () => {
  const addon = fixtures.addons['dwh-db']

  beforeEach(() => {
    nock('https://api.heroku.com')
      .post('/actions/addons/resolve', {
        app: 'myapp',
        addon: 'test-database',
      }).reply(200, [addon])
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('shows settings for auto_explain with value', async () => {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {log_lock_waits: {value: 'test_value'}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      auto-explain.log-buffers is set to test_value for ${addon.name}.
      Buffer statistics have been enabled for auto_explain.
    `))
  })

  it('shows settings for auto_explain with no value', async () => {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {log_lock_waits: {value: ''}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      auto-explain.log-buffers is set to  for ${addon.name}.
      Buffer statistics have been disabled for auto_explain.
    `))
  })
})



// it('shows settings for auto_explain_log_buffers with value', () => {
//   setupSettingsMockData('auto_explain.log_buffers')
//   cmd = proxyquire('../../../../commands/settings/auto_explain_log_buffers', {
//     settings: proxyquire.noCallThru().load('../../../../lib/setter', {
//       './fetcher': fetcher,
//     }),
//   })
//   pg.get('/postgres/v0/databases/1/config').reply(200, settingsResult)
//   return cmd.run({args: {database: 'test-database', value: ''}, flags: {}})
//     .then(() => expect(cli.stdout).to.equal('auto-explain.log-buffers is set to test_value for postgres-1.\nBuffer statistics have been enabled for auto_explain.\n'))
// })

// it('shows settings for auto_explain_log_buffers with no value', () => {
//   setupSettingsMockData('auto_explain.log_buffers', '')
//   cmd = proxyquire('../../../../commands/settings/auto_explain_log_buffers', {
//     settings: proxyquire.noCallThru().load('../../../../lib/setter', {
//       './fetcher': fetcher,
//     }),
//   })
//   pg.get('/postgres/v0/databases/1/config').reply(200, settingsResult)
//   return cmd.run({args: {database: 'test-database', value: ''}, flags: {}})
//     .then(() => expect(cli.stdout).to.equal('auto-explain.log-buffers is set to  for postgres-1.\nBuffer statistics have been disabled for auto_explain.\n'))
// })
