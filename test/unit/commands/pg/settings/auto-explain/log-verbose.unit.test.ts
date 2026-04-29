import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-verbose.js'
import * as fixtures from '../../../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('pg:settings:auto-explain:log-verbose', function () {
  let api: nock.Scope
  let pg: nock.Scope
  const addon = fixtures.addons['dwh-db']

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {
      addon_attachment: 'test-database',
      app: 'myapp',
    }).reply(200, [{addon}])

    pg = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    api.done()
    pg.done()
  })

  it('shows settings for auto_explain.log_verbose with value', async function () {
    pg.get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_verbose': {value: 'test_value'}})
    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
    auto-explain.log-verbose is set to test_value for ${addon.name}.
    Verbose execution plan logging has been enabled for auto_explain.
    `))
  })

  it('shows settings for auto_explain.log_verbose with no value', async function () {
    pg.get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_verbose': {value: ''}})
    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
    auto-explain.log-verbose is set to  for ${addon.name}.
    Verbose execution plan logging has been disabled for auto_explain.
    `))
  })
})
