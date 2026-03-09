import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'
import {runCommand} from '../../../../../helpers/run-command.js'
import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-triggers.js'
import * as fixtures from '../../../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('pg:settings:auto-explain:log-triggers', function () {
  const addon = fixtures.addons['dwh-db']
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'test-database',
        addon_service: 'heroku-postgresql',
      }).reply(200, [{addon}])
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('updates settings for auto_explain.log_triggers with value', async function () {
    const pg = nock('https://api.data.heroku.com')
      .patch(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_triggers': {value: true}})

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database', 'true'])

    api.done()
    pg.done()

    expect(stdout).to.equal(heredoc(`
      auto-explain.log-triggers has been set to true for ${addon.name}.
      Trigger execution statistics have been enabled for auto-explain.
    `))
  })

  it('shows settings for auto_explain.log_triggers with no value', async function () {
    const pg = nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_triggers': {value: false}})

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])

    api.done()
    pg.done()

    expect(stdout).to.equal(heredoc(`
      auto-explain.log-triggers is set to false for ${addon.name}.
      Trigger execution statistics have been disabled for auto-explain.
    `))
  })
})
