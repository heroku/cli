import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand'
import Cmd from '../../../../../src/commands/pg/settings/data-connector-details-logs'
import * as fixtures from '../../../../fixtures/addons/fixtures'

describe('pg:data-connector-details-logs', function () {
  let addon: any

  beforeEach(function () {
    addon = fixtures.addons['dwh-db']
    nock('https://api.heroku.com')
      .post('/actions/addons/resolve', {
        app: 'myapp',
        addon: 'test-database',
      }).reply(200, [addon])
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('turns on data-connector-details-logs option', async function () {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {explain_data_connector_details: {value: 'on'}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      explain_data_connector_details is set to on for ${addon.name}.
      Data replication slot details will be logged.
    `))
  })

  it('turns off data-connector-details-logs option', async function () {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {explain_data_connector_details: {value: ''}})
    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      explain_data_connector_details is set to  for ${addon.name}.
      Data replication slot details will no longer be logged.
    `))
  })
})
