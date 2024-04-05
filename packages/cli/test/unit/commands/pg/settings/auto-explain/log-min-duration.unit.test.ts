import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../../helpers/runCommand'
import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-min-duration'
import * as fixtures from '../../../../../fixtures/addons/fixtures'

describe.only('pg:settings:auto-explain:log-min-duration', () => {
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
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_min_duration': {value: 'test_value'}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      auto-explain.log-min-duration is set to test_value for ${addon.name}.
      All execution plans will be logged for queries taking up to test_value milliseconds or more.
    `))
  })

  it('shows settings for auto_explain with no value', async () => {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_min_duration': {value: -1}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      auto-explain.log-min-duration is set to -1 for ${addon.name}.
      Execution plan logging has been disabled.
    `))
  })

  it('shows settings for auto_explain with no value', async () => {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_min_duration': {value: 0}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      auto-explain.log-min-duration is set to 0 for ${addon.name}.
      All queries will have their execution plans logged.
    `))
  })
})
