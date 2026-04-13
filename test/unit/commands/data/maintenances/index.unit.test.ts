import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import DataMaintenancesIndex from '../../../../../src/commands/data/maintenances/index.js'
import {Maintenance, MaintenanceStatus} from '../../../../../src/lib/data/types.js'
import runCommand from '../../../../helpers/legacy-run-command.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

const appId = '30f93b8f-c592-4004-8d8a-3efb20395484'

const app = {
  id: appId,
  name: 'test-app',
}

const postgresAddonMaintenance: Maintenance = {
  addon: {
    attachments: ['DATABASE_URL'],
    kind: 'heroku-postgresql',
    name: 'postgresql-sinuous-83720',
    plan: 'standard-0',
    window: 'Thursdays 22:00 to Fridays 02:00 UTC',
  },
  app: {
    name: 'test-app',
  },
  completed_at: null,
  duration_seconds: null,
  method: 'changeover',
  previously_scheduled_for: '2019-11-05 22:00:00 +0000',
  reason: 'routine_maintenance',
  required_by: '2019-11-12 17:57:01 +0000',
  scheduled_for: '2019-11-07 22:00:00 +0000',
  server_created_at: '2019-10-24 23:24:47 +0000',
  started_at: null,
  status: MaintenanceStatus.none,
  window: 'Thursdays 22:00 to Fridays 02:00 UTC',
}

const redisAddonMaintenance: Maintenance = {
  addon: {
    attachments: ['REDIS_URL'],
    kind: 'heroku-redis',
    name: 'redis-contoured-23719',
    plan: 'premium-0',
    window: 'Thursdays 22:00 to Fridays 02:00 UTC',
  },
  app: {
    name: 'test-app',
  },
  completed_at: null,
  duration_seconds: null,
  method: 'changeover',
  previously_scheduled_for: null,
  reason: 'routine_maintenance',
  required_by: null,
  scheduled_for: null,
  server_created_at: '2019-10-24 23:24:47 +0000',
  started_at: null,
  status: MaintenanceStatus.pending,
  window: 'Thursdays 22:00 to Fridays 02:00 UTC',
}

const maintenances = [redisAddonMaintenance, postgresAddonMaintenance]

describe('data:maintenances', function () {
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

  it('shows a list of maintenances for a given app', async function () {
    herokuApi
      .get('/apps/test-app')
      .reply(200, app)
    dataApi
      .get(`/data/maintenances/v1/apps/${appId}`)
      .reply(200, {maintenances})

    await runCommand(DataMaintenancesIndex, ['--app=test-app'])
    const actualStdout = removeAllWhitespace(stdout.output)

    expect(stderr.output).to.contain('Fetching maintenances... done')
    expect(actualStdout).to.contain(removeAllWhitespace('Addon                      Attachments    Scheduling Window                      Status    Required by                 Scheduled for'))
    expect(actualStdout).to.contain(removeAllWhitespace('redis-contoured-23719      REDIS_URL      Thursdays 22:00 to Fridays 02:00 UTC   pending   -                           -'))
    expect(actualStdout).to.contain(removeAllWhitespace('postgresql-sinuous-83720   DATABASE_URL   Thursdays 22:00 to Fridays 02:00 UTC   none      2019-11-12 17:57:01 +0000   2019-11-07 22:00:00 +0000'))
  })

  it('includes extended columns', async function () {
    herokuApi
      .get('/apps/test-app')
      .reply(200, app)
    dataApi
      .get(`/data/maintenances/v1/apps/${appId}`)
      .reply(200, {maintenances})

    await runCommand(DataMaintenancesIndex, ['--app=test-app', '--extended', '--sort=Addon'])
    const actualStdout = removeAllWhitespace(stdout.output)

    expect(actualStdout).to.contain(removeAllWhitespace('Addon                      Attachments    Scheduling Window                      Status    Required by                 Scheduled for               Kind                Plan'))
    expect(actualStdout).to.contain(removeAllWhitespace('postgresql-sinuous-83720   DATABASE_URL   Thursdays 22:00 to Fridays 02:00 UTC   none      2019-11-12 17:57:01 +0000   2019-11-07 22:00:00 +0000   heroku-postgresql   standard-0'))
  })

  it('only includes specified columns', async function () {
    herokuApi
      .get('/apps/test-app')
      .reply(200, app)
    dataApi
      .get(`/data/maintenances/v1/apps/${appId}`)
      .reply(200, {maintenances})

    await runCommand(DataMaintenancesIndex, ['--app=test-app', '--extended', '--columns=addon,attachments'])
    const actualStdout = removeAllWhitespace(stdout.output)

    expect(actualStdout).to.contain(removeAllWhitespace('Addon                      Attachments'))
    expect(actualStdout).to.contain(removeAllWhitespace('postgresql-sinuous-83720   DATABASE_URL'))
  })

  it('shows a list of maintenances for a given app with the json flag', async function () {
    herokuApi
      .get('/apps/test-app')
      .reply(200, app)
    dataApi
      .get(`/data/maintenances/v1/apps/${appId}`)
      .reply(200, {maintenances})

    await runCommand(DataMaintenancesIndex, ['--app=test-app', '--json'])

    expect(stderr.output).to.contain('Fetching maintenances... done')
    expect(JSON.parse(stdout.output)).to.deep.equal(maintenances)
  })

  it('shows an error if the app is not found', async function () {
    herokuApi
      .get('/apps/test-app')
      .reply(404, {
        id: 'not_found',
        message: "Couldn't find that app.",
      })

    try {
      await runCommand(DataMaintenancesIndex, ['--app=test-app'])
    } catch (error) {
      const {message} = error as {message: string}
      expect(message).to.contain("Couldn't find that app.\n\nError ID: not_found")
    }
  })

  it('shows an error message if there are no maintenances', async function () {
    herokuApi
      .get('/apps/test-app')
      .reply(200, app)
    dataApi
      .get(`/data/maintenances/v1/apps/${appId}`)
      .reply(200, {maintenances: []})

    try {
      await runCommand(DataMaintenancesIndex, ['--app=test-app'])
    } catch (error) {
      const {message} = error as {message: string}
      expect(message).to.equal('No maintenances found for app test-app')
    }
  })
})
