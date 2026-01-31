import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand.js'
import Cmd from '../../../../../src/commands/pg/settings/track-functions.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('pg:settings:track-functions', function () {
  const addon = fixtures.addons['dwh-db']
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'test-database',
        addon_service: 'heroku-postgresql',
      })
      .reply(200, [{addon}])
  })

  afterEach(function () {
    api.done()
    pg.done()
    nock.cleanAll()
  })

  it('shows settings for track_functions with value', async function () {
    pg = nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {
        track_functions: {
          value: 'test_value',
          values: {test_value: 'No function calls will be tracked.'},
        },
      })
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      track-functions is set to test_value for ${addon.name}.
      No function calls will be tracked.
    `))
  })
})
