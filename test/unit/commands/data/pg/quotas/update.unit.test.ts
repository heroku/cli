import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import DataPgQuotasUpdate from '../../../../../../src/commands/data/pg/quotas/update.js'
import {
  addon,
  nonAdvancedAddon,
  storageQuotaResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc.default

describe('data:pg:quotas:update', function () {
  let dataApi: nock.Scope
  let herokuApi: nock.Scope

  beforeEach(function () {
    dataApi = nock('https://api.data.heroku.com')
    herokuApi = nock('https://api.heroku.com')
  })

  afterEach(function () {
    dataApi.done()
    herokuApi.done()
  })

  it('prints the updated quota settings when the quota update is successful', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .patch(`/data/postgres/v1/${addon.id}/quotas/storage`)
      .reply(200, storageQuotaResponse)

    const {stderr, stdout} = await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--warning=50',
      '--critical=100',
      '--enforcement-action=none',
    ])

    expect(stderr).to.equal(heredoc(`
      Updating storage quota on ⛁ advanced-horizontal-01234... done
    `))
    expect(stdout).to.equal(heredoc(`
      === Storage

      Warning:            50.00 GB
      Critical:           100.00 GB
      Enforcement Action: None
      Status:             0.00 MB / 100.00 GB (Within configured quotas)
    `))
  })

  it('sends the correct quota updates to the data API', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .patch(`/data/postgres/v1/${addon.id}/quotas/storage`, {
        critical_gb: 100,
        enforcement_action: 'none',
        warning_gb: 50,
      })
      .reply(200, storageQuotaResponse)

    await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--warning=50',
      '--critical=100',
      '--enforcement-action=none',
    ])

    // this test will fail with "Nock: No match for request" if the dataApi patch request body is incorrect
  })

  it('sets the warning_gb to null when the warning flag is set to "none"', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .patch(`/data/postgres/v1/${addon.id}/quotas/storage`, {
        warning_gb: null,
      })
      .reply(200, storageQuotaResponse)

    await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--warning=none',
    ])

    // this test will fail with "Nock: No match for request" if the dataApi patch request body is incorrect
  })

  it('sets the critical_gp to null when the critical flag is set to "none"', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    dataApi
      .patch(`/data/postgres/v1/${addon.id}/quotas/storage`, {
        critical_gb: null,
      })
      .reply(200, storageQuotaResponse)

    await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--critical=none',
    ])

    // this test will fail with "Nock: No match for request" if the dataApi patch request body is incorrect
  })

  it('will fail if neither of the warning, critical, or enforcement-action flags are set', async function () {
    const {error} = await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You must set a value for either the warning, critical, or enforcement-action flags')
  })

  it('errors when used with non-Advanced-tier add-ons', async function () {
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])

    const {error} = await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--warning=50',
    ])
    const err = error as Error

    herokuApi.done()
    expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases.')
  })

  it('errors when the --warning flag is not an integer or "none"', async function () {
    const {error} = await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--warning=nope',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal(heredoc(`
        Parsing --warning
        You can only enter an integer or "none" in the --warning flag.
        See more help with --help
      `))
  })

  it('errors when the --critical flag is not an integer or "none"', async function () {
    const {error} = await runCommand(DataPgQuotasUpdate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--type=storage',
      '--critical=nope',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal(heredoc(`
        Parsing --critical
        You can only enter an integer or "none" in the --critical flag.
        See more help with --help
        `))
  })
})
