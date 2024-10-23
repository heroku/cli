
import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../../helpers/runCommand'
import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-format'
import * as fixtures from '../../../../../fixtures/addons/fixtures'

describe('pg:settings:auto-explain:log-format', function () {
  const addon = fixtures.addons['dwh-db']
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
      .post('/actions/addons/resolve', {
        app: 'myapp',
        addon: 'test-database',
      }).reply(200, [addon])
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('updates settings for auto_explain.log_format with value', async function () {
    const pg = nock('https://api.data.heroku.com')
      .patch(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_format': {value: 'json'}})

    await runCommand(Cmd, ['--app', 'myapp', 'test-database', 'json'])

    api.done()
    pg.done()

    expect(stdout.output).to.equal(heredoc(`
      auto-explain.log-format has been set to json for ${addon.name}.
      Auto explain log output will log in json format.
    `))
  })
})
