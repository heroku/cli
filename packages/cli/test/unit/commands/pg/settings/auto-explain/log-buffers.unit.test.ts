import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../../helpers/runCommand'
import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-buffers'
import * as fixtures from '../../../../../fixtures/addons/fixtures'

describe('pg:settings:auto-explain:log-buffers', function () {
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
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_buffers': {value: 'test_value'}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      auto-explain.log-buffers is set to test_value for ${addon.name}.
      Buffer statistics have been enabled for auto_explain.
    `))
  })

  it('shows settings for auto_explain with no value', async function () {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_buffers': {value: ''}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      auto-explain.log-buffers is set to  for ${addon.name}.
      Buffer statistics have been disabled for auto_explain.
    `))
  })
})
