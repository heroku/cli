import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import DataMaintenancesWindow from '../../../../../../src/commands/data/maintenances/window/index.js'
import {maintenanceWindow} from '../../../../../fixtures/data/maintenances/fixtures.js'
import {addon, nonPostgresAddon} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/runCommand.js'

describe('data:maintenances:window', function () {
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

  it('can fetch a window for an addon', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .get(`/data/maintenances/v1/${addon.id}/window`)
      .reply(200, maintenanceWindow)

    await runCommand(DataMaintenancesWindow, [addon.name])

    expect(stderr.output).to.contain(`Fetching maintenance window for ${addon.name}... done\n`)
    expect(stdout.output).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })

  it('can fetch a window for an addon scoped by an app', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .get(`/data/maintenances/v1/${addon.id}/window`)
      .reply(200, maintenanceWindow)

    await runCommand(DataMaintenancesWindow, [addon.name, `--app=${app.name}`])

    expect(stderr.output).to.contain(`Fetching maintenance window for ${addon.name}... done\n`)
    expect(stdout.output).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })

  it('can fetch a window for a non-postgres addon', async function () {
    herokuApi
      .post('/actions/addons/resolve', body => body.addon_service === undefined)
      .reply(200, [nonPostgresAddon])
    dataApi
      .get(`/data/maintenances/v1/${nonPostgresAddon.id}/window`)
      .reply(200, maintenanceWindow)

    await runCommand(DataMaintenancesWindow, [nonPostgresAddon.name])

    expect(stderr.output).to.contain(`Fetching maintenance window for ${nonPostgresAddon.name}... done\n`)
    expect(stdout.output).to.contain('window:          Tuesdays 17:30 to 21:30 UTC\n')
  })
})
