import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import DataMaintenancesInfo from '../../../../../src/commands/data/maintenances/info.js'
import {addon} from '../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'
import {unwrap} from '../../../../helpers/utils/unwrap.js'

describe('data:maintenances:info', function () {
  const app = {
    name: 'test-app',
  }

  const maintenance = {
    addon_attachments: 'DATABASE_URL',
    addon_kind: 'heroku-postgresql',
    addon_name: 'postgresql-sinuous-83720',
    addon_plan: 'standard-0',
    addon_window: 'Thursdays 22:00 to Fridays 02:00 UTC',
    app_name: 'test-app',
    method: 'changeover',
    previously_scheduled_for: '2019-11-05 22:00:00 +0000',
    reason: 'routine_maintenance',
    required_by: '2019-11-12 17:57:01 +0000',
    scheduled_for: '2019-11-07 22:00:00 +0000',
    server_created_at: '2019-10-24 23:24:47 +0000',
    status: 'none',
    window: 'Thursdays 22:00 to Fridays 02:00 UTC',
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

  it('shows a maintenance for an addon in styled object format by default', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(200, maintenance)

    await runCommand(DataMaintenancesInfo, [addon.name])

    expect(unwrap(stderr.output)).to.contain('Fetching maintenance for advanced-horizontal-01234... done\n')
    expect(stdout.output).to.equal(`addon_attachments:        DATABASE_URL
addon_kind:               heroku-postgresql
addon_name:               postgresql-sinuous-83720
addon_plan:               standard-0
addon_window:             Thursdays 22:00 to Fridays 02:00 UTC
app_name:                 test-app
method:                   changeover
previously_scheduled_for: 2019-11-05 22:00:00 +0000
reason:                   routine_maintenance
required_by:              2019-11-12 17:57:01 +0000
scheduled_for:            2019-11-07 22:00:00 +0000
server_created_at:        2019-10-24 23:24:47 +0000
status:                   none
window:                   Thursdays 22:00 to Fridays 02:00 UTC
`)
  })

  it('shows a maintenance for an addon with duration_seconds and generated approximate duration', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(200, {...maintenance, duration_seconds: 872.976767})

    await runCommand(DataMaintenancesInfo, [addon.name])

    expect(unwrap(stderr.output)).to.contain('Fetching maintenance for advanced-horizontal-01234... done\n')
    expect(stdout.output).to.equal(`addon_attachments:        DATABASE_URL
addon_kind:               heroku-postgresql
addon_name:               postgresql-sinuous-83720
addon_plan:               standard-0
addon_window:             Thursdays 22:00 to Fridays 02:00 UTC
app_name:                 test-app
method:                   changeover
previously_scheduled_for: 2019-11-05 22:00:00 +0000
reason:                   routine_maintenance
required_by:              2019-11-12 17:57:01 +0000
scheduled_for:            2019-11-07 22:00:00 +0000
server_created_at:        2019-10-24 23:24:47 +0000
status:                   none
window:                   Thursdays 22:00 to Fridays 02:00 UTC
duration_seconds:         872.976767
duration_approximate:     ~ 15 minutes
`)
  })

  it('shows a maintenance for an addon scoped by the app flag', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(200, maintenance)

    await runCommand(DataMaintenancesInfo, [addon.name, `--app=${app.name}`])

    expect(unwrap(stderr.output)).to.contain('Fetching maintenance for advanced-horizontal-01234... done\n')
    expect(stdout.output).to.equal(`addon_attachments:        DATABASE_URL
addon_kind:               heroku-postgresql
addon_name:               postgresql-sinuous-83720
addon_plan:               standard-0
addon_window:             Thursdays 22:00 to Fridays 02:00 UTC
app_name:                 test-app
method:                   changeover
previously_scheduled_for: 2019-11-05 22:00:00 +0000
reason:                   routine_maintenance
required_by:              2019-11-12 17:57:01 +0000
scheduled_for:            2019-11-07 22:00:00 +0000
server_created_at:        2019-10-24 23:24:47 +0000
status:                   none
window:                   Thursdays 22:00 to Fridays 02:00 UTC
`)
  })

  it('shows a maintenance for an addon in json format', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(200, maintenance)

    await runCommand(DataMaintenancesInfo, [addon.name, '--json'])

    expect(unwrap(stderr.output)).to.contain('Fetching maintenance for advanced-horizontal-01234... done\n')
    expect(JSON.parse(stdout.output)).to.deep.equal(maintenance)
  })

  it('shows 404 error when maintenance is not found', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .get(`/data/maintenances/v1/${addon.id}`)
      .reply(404, {message: 'not found'})

    try {
      await runCommand(DataMaintenancesInfo, [addon.name, `--app=${app.name}`])
    } catch (error) {
      const {message} = error as {message: string}
      expect(message).to.equal('not found')
    }
  })
})
