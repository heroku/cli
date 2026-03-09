import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import DataMaintenancesHistory from '../../../../../src/commands/data/maintenances/history.js'
import {Maintenance, MaintenanceStatus} from '../../../../../src/lib/data/types.js'
import runCommand from '../../../../helpers/runCommand.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'
import {unwrap} from '../../../../helpers/utils/unwrap.js'
import DataMaintenancesIndex from '../../../../../src/commands/data/maintenances/index.js'

const addonFixture = {
  id: 'b8966596-d1af-4f39-8c72-a8b4d6a5d3e1',
  name: 'postgresql-sinuous-83720',
}

const maintenancesFixture: Maintenance[] = [
  {
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
    previously_scheduled_for: null,
    reason: 'hardware_issue',
    required_by: null,
    scheduled_for: null,
    server_created_at: '2019-10-24 23:24:47 +0000',
    started_at: null,
    status: MaintenanceStatus.pending,
    window: 'Thursdays 22:00 to Fridays 02:00 UTC',
  },
  {
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
    previously_scheduled_for: null,
    reason: 'routine_maintenance',
    required_by: null,
    scheduled_for: '2019-11-07 22:00:00 +0000',
    server_created_at: '2019-10-24 23:24:47 +0000',
    started_at: null,
    status: MaintenanceStatus.none,
    window: 'Thursdays 22:00 to Fridays 02:00 UTC',
  },
]

describe('data:maintenances:history', function () {
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

  it('shows a list of maintenances for addon', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addonFixture])
    dataApi
      .get(`/data/maintenances/v1/${addonFixture.id}/history/?limit=5`)
      .reply(200, {maintenances: maintenancesFixture})

    await runCommand(DataMaintenancesHistory, [addonFixture.name])
    const actualStdout = removeAllWhitespace(stdout.output)

    expect(unwrap(stderr.output)).to.contain('Fetching maintenance history for postgresql-sinuous-83720... done')
    expect(actualStdout).to.contain(removeAllWhitespace('Scheduled for               Started at   Completed at   Duration (seconds)   Reason                Status    Window'))
    expect(actualStdout).to.contain(removeAllWhitespace('-                           -            -              -                    hardware_issue        pending   Thursdays 22:00 to Fridays 02:00 UTC'))
    expect(actualStdout).to.contain(removeAllWhitespace('2019-11-07 22:00:00 +0000   -            -              -                    routine_maintenance   none      Thursdays 22:00 to Fridays 02:00 UTC'))
  })

  it('shows a list of maintenances for addons with only the specified columns', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addonFixture])
    dataApi
      .get(`/data/maintenances/v1/${addonFixture.id}/history/?limit=5`)
      .reply(200, {maintenances: maintenancesFixture})

    await runCommand(DataMaintenancesHistory, [addonFixture.name, '--columns=scheduled_for,started_at'])
    const actualStdout = removeAllWhitespace(stdout.output)

    expect(unwrap(stderr.output)).to.contain('Fetching maintenance history for postgresql-sinuous-83720... done')
    expect(actualStdout).to.contain(removeAllWhitespace('Scheduled for               Started at'))
    expect(actualStdout).to.contain(removeAllWhitespace('-                           -'))
    expect(actualStdout).to.contain(removeAllWhitespace('2019-11-07 22:00:00 +0000   -'))
    expect(actualStdout).to.not.contain(removeAllWhitespace('Completed at'))
  })

  it('shows a list of maintenances for addon capped at the number specified by the num flag', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addonFixture])
    // Note: The URL ends in /1 denoting a history request of 1 element
    // based on the --num=1 flag
    dataApi
      .get(`/data/maintenances/v1/${addonFixture.id}/history/?limit=1`)
      .reply(200, {maintenances: [maintenancesFixture[0]]})

    await runCommand(DataMaintenancesHistory, [addonFixture.name, '--num=1'])
    const actualStdout = removeAllWhitespace(stdout.output)

    expect(unwrap(stderr.output)).to.contain('Fetching maintenance history for postgresql-sinuous-83720... done')
    expect(actualStdout).to.contain(removeAllWhitespace('Scheduled for   Started at   Completed at   Duration (seconds)   Reason           Status    Window'))
    expect(actualStdout).to.contain(removeAllWhitespace('-               -            -              -                    hardware_issue   pending   Thursdays 22:00 to Fridays 02:00 UTC'))
  })

  it('shows maintenances for addon formatted in json', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addonFixture])
    dataApi
      .get(`/data/maintenances/v1/${addonFixture.id}/history/?limit=5`)
      .reply(200, {maintenances: maintenancesFixture})

    await runCommand(DataMaintenancesHistory, [addonFixture.name, '--json'])

    expect(unwrap(stderr.output)).to.contain('Fetching maintenance history for postgresql-sinuous-83720... done')
    expect(JSON.parse(stdout.output)).to.deep.equal(maintenancesFixture)
  })

  it('shows a message when there are no maintenances for an addon', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addonFixture])
    dataApi
      .get(`/data/maintenances/v1/${addonFixture.id}/history/?limit=5`)
      .reply(200, {maintenances: []})

    await runCommand(DataMaintenancesHistory, [addonFixture.name, '--json'])

    expect(stdout.output).to.equal('postgresql-sinuous-83720 does not have any maintenance history\n')
  })
})
