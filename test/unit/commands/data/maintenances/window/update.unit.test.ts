import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import DataMaintenancesWindowUpdate from '../../../../../../src/commands/data/maintenances/window/update.js'
import {maintenanceWindow} from '../../../../../fixtures/data/maintenances/fixtures.js'
import {addon, nonPostgresAddon} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/legacy-run-command.js'

describe('data:maintenances:window:update', function () {
  const app = {
    name: 'test-app',
  }

  let herokuApi: nock.Scope
  let dataApi: nock.Scope

  beforeEach(function () {
    herokuApi = nock('https://api.heroku.com')
    dataApi = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    herokuApi.done()
    dataApi.done()
    nock.cleanAll()
  })

  it('can change a window for an addon', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .post(`/data/maintenances/v1/${addon.id}/window`, {
        day_of_week: 'tuesday',
        time_of_day: '5:30PM',
      })
      .reply(200, maintenanceWindow)

    await runCommand(DataMaintenancesWindowUpdate, [addon.name, 'tuesday', '5:30PM'])

    expect(stderr.output).to.contain(`Setting maintenance window for ${addon.name} to tuesday 5:30PM... done`)
    expect(stdout.output).to.contain('previous_window: Fridays 17:30 to 21:30 UTC\n')
    expect(stdout.output).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })

  it('can change a window for an addon scoped by an app', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .post(`/data/maintenances/v1/${addon.id}/window`, {
        day_of_week: 'tuesday',
        time_of_day: '5:30PM',
      })
      .reply(200, maintenanceWindow)

    await runCommand(DataMaintenancesWindowUpdate, [addon.name, 'tuesday', '5:30PM', `--app=${app.name}`])

    expect(stderr.output).to.contain(`Setting maintenance window for ${addon.name} to tuesday 5:30PM... done`)
    expect(stdout.output).to.contain('previous_window: Fridays 17:30 to 21:30 UTC\n')
    expect(stdout.output).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })

  it('can change a window for a non-postgres addon', async function () {
    herokuApi
      .post('/actions/addons/resolve', body => body.addon_service === undefined)
      .reply(200, [nonPostgresAddon])
    dataApi
      .post(`/data/maintenances/v1/${nonPostgresAddon.id}/window`, {
        day_of_week: 'tuesday',
        time_of_day: '5:30PM',
      })
      .reply(200, maintenanceWindow)

    await runCommand(DataMaintenancesWindowUpdate, [nonPostgresAddon.name, 'tuesday', '5:30PM'])

    expect(stderr.output).to.contain(`Setting maintenance window for ${nonPostgresAddon.name} to tuesday 5:30PM... done`)
    expect(stdout.output).to.contain('previous_window: Fridays 17:30 to 21:30 UTC\n')
    expect(stdout.output).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })
})
