import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../../helpers/runCommand'
import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-verbose'
import * as fixtures from '../../../../../fixtures/addons/fixtures'

describe('pg:settings:auto-explain:log-verbose', () => {
  let api: nock.Scope
  let pg: nock.Scope
  const addon = fixtures.addons['dwh-db']

  beforeEach(() => {
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

  it('shows settings for auto_explain_log_verbose with value', async () => {
    pg.get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_verbose': {value: 'test_value'}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
    auto-explain.log-verbose is set to test_value for ${addon.name}.
    Verbose execution plan logging has been enabled for auto_explain.
    `))
  })

  it('shows settings for auto_explain_log_verbose with no value', async () => {
    pg.get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_verbose': {value: ''}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
    auto-explain.log-verbose is set to  for ${addon.name}.
    Verbose execution plan logging has been disabled for auto_explain.
    `))
  })
})
