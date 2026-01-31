import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand.js'
import Cmd from '../../../../../src/commands/pg/settings/data-connector-details-logs.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('pg:data-connector-details-logs', function () {
  const addon = fixtures.addons['dwh-db']

  beforeEach(function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'test-database',
        addon_service: 'heroku-postgresql',
      }).reply(200, [{addon}])
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('turns on data-connector-details-logs option', async function () {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {data_connector_details_logs: {value: 'on'}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      data-connector-details-logs is set to on for ${addon.name}.
      Data replication slot details will be logged.
    `))
  })

  it('turns off data-connector-details-logs option', async function () {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {data_connector_details_logs: {value: ''}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      data-connector-details-logs is set to  for ${addon.name}.
      Data replication slot details will no longer be logged.
    `))
  })
})
