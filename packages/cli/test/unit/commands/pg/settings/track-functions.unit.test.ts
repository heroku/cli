import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand'
import Cmd from '../../../../../src/commands/pg/settings/track-functions'

describe('pg:settings:track-functions', function () {
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(function () {
    const addon = {
      id: 1,
      name: 'postgres-1',
      app: {name: 'myapp'},
      config_vars: ['READONLY_URL', 'DATABASE_URL', 'HEROKU_POSTGRESQL_RED_URL'],
      plan: {name: 'heroku-postgresql:premium-0'},
    }

    api = nock('https://api.heroku.com')
    api.post('/actions/addons/resolve', {
      app: 'myapp',
      addon: 'test-database',
    }).reply(200, [addon])

    pg = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    api.done()
    pg.done()
  })

  it('shows settings for track_functions with value', async function () {
    pg.get('/postgres/v0/databases/1/config').reply(200, {
      track_functions: {
        value: 'test_value',
        values: {test_value: 'No function calls will be tracked.'},
      },
    })
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
    track-functions is set to test_value for postgres-1.
    No function calls will be tracked.
    `))
  })
})
