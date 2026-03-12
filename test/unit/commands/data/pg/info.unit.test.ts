import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgInfo from '../../../../../src/commands/data/pg/info.js'
import {
  addon,
  multipleAttachmentsResponse,
  nonAdvancedAddon,
  pgInfo,
  pgInfoWithDisabledFeatures,
  pgInfoWithForkedDatabase,
  pgInfoWithUncompliantPlanLimits,
} from '../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('data:pg:info', function () {
  let dataApi: nock.Scope
  let herokuApi: nock.Scope

  beforeEach(function () {
    dataApi = nock('https://api.data.heroku.com')
    herokuApi = nock('https://api.heroku.com')
  })

  afterEach(function () {
    sinon.restore()
    dataApi.done()
    herokuApi.done()
  })

  it('returns info with pool information', async function () {
    dataApi
      .get(`/data/postgres/v1/${addon.id}/info`)
      .reply(200, pgInfo)
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, multipleAttachmentsResponse)

    await runCommand(DataPgInfo, [
      'advanced-horizontal-01234',
      '--app=myapp',
    ])

    expect(stderr.output).to.equal('')
    expect(ansis.strip(stdout.output)).to.equal(
      // cspell:disable
      heredoc(`
        === ⛁ advanced-horizontal-01234 on ⬢ myapp

        Plan:       Advanced
        Status:     Available
        Data Size:  1.10 GB / 128.00 TB
        Tables:     10 / 4000 (In compliance)
        PG Version: 17.5
        Rollback:   earliest from 2025-01-02 00:00 UTC
        Region:     us
        Created:    2025-01-01 00:00 UTC
        Quotas:      
          Storage:  1.10 GB (No quotas set)

        === Leader pool (attached as DATABASE)

          ✓ Available
          Connections: 10 / 400 used
          2 instances of 4G-Performance (HA):
            leader.i3r507gt6dbscn: up
            standby.i7fquhvs4efu74: up

        === Follower pool analytics (attached as DATABASE_ANALYTICS)

          ✓ Available
          Connections: 50 / 800 used
          2 instances of 4G-Performance (HA):
            follower.ic7mb4lq0rkurk: up
            follower.i7q78mp2fg4v15: up

      `),
      // cspell:enable
    )
  })

  it('returns info with forked database information', async function () {
    dataApi
      .get(`/data/postgres/v1/${addon.id}/info`)
      .reply(200, pgInfoWithForkedDatabase)
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, multipleAttachmentsResponse)

    await runCommand(DataPgInfo, [
      'advanced-horizontal-01234',
      '--app=myapp',
    ])

    expect(stderr.output).to.equal('')
    expect(ansis.strip(stdout.output)).to.equal(
      // cspell:disable
      heredoc(`
        === ⛁ advanced-horizontal-01234 on ⬢ myapp

        Plan:        Advanced
        Status:      Available
        Data Size:   1.10 GB / 128.00 TB
        Tables:      10 / 4000 (In compliance)
        PG Version:  17.5
        Rollback:    earliest from 2025-01-02 00:00 UTC
        Region:      us
        Forked From: ⛁ advanced-oblique-01234
        Created:     2025-01-01 00:00 UTC
        Quotas:       
          Storage:   1.10 GB (No quotas set)

        === Leader pool (attached as DATABASE)

          ✓ Available
          Connections: 10 / 400 used
          2 instances of 4G-Performance (HA):
            leader.i3r507gt6dbscn: up
            standby.i7fquhvs4efu74: up

        === Follower pool analytics (attached as DATABASE_ANALYTICS)

          ✓ Available
          Connections: 50 / 800 used
          2 instances of 4G-Performance (HA):
            follower.ic7mb4lq0rkurk: up
            follower.i7q78mp2fg4v15: up

      `),
      // cspell:enable
    )
  })

  it('returns info correctly when features are disabled', async function () {
    dataApi
      .get(`/data/postgres/v1/${addon.id}/info`)
      .reply(200, pgInfoWithDisabledFeatures)
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, multipleAttachmentsResponse)

    await runCommand(DataPgInfo, [
      'advanced-horizontal-01234',
      '--app=myapp',
    ])

    expect(stderr.output).to.equal('')
    expect(ansis.strip(stdout.output)).to.equal(
      // cspell:disable
      heredoc(`
        === ⛁ advanced-horizontal-01234 on ⬢ myapp

        Plan:       Advanced
        Status:     Available
        Data Size:  1.10 GB / 128.00 TB
        Tables:     10 / 4000 (In compliance)
        PG Version: 17.5
        Rollback:   Unsupported
        Region:     us
        Created:    2025-01-01 00:00 UTC
        Quotas:      
          Storage:  1.10 GB (No quotas set)

        === Leader pool (attached as DATABASE)

          ✓ Available
          Connections: 10 / 400 used
          1 instance of 4G-Performance:
            leader.i3r507gt6dbscn: up

      `),
      // cspell:enable
    )
  })

  it('returns info correctly when rollback is enabled but no earliest_time is available', async function () {
    const info = {
      ...pgInfo,
      features: {
        ...pgInfo.features,
        rollback: {
          earliest_time: null,
          enabled: true,
          latest_time: null,
        },
      },
    }

    dataApi
      .get(`/data/postgres/v1/${addon.id}/info`)
      .reply(200, info)
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, multipleAttachmentsResponse)

    await runCommand(DataPgInfo, [
      'advanced-horizontal-01234',
      '--app=myapp',
    ])

    expect(stderr.output).to.equal('')
    expect(ansis.strip(stdout.output.replaceAll(/\s+/g, ' '))).to.include('Rollback: Unavailable')
  })

  it('returns info correctly when the table limits are not in compliance', async function () {
    dataApi
      .get(`/data/postgres/v1/${addon.id}/info`)
      .reply(200, pgInfoWithUncompliantPlanLimits)
    herokuApi
      .post('/actions/addons/resolve')
      .reply(200, [addon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, multipleAttachmentsResponse)

    await runCommand(DataPgInfo, [
      'advanced-horizontal-01234',
      '--app=myapp',
    ])

    expect(stderr.output).to.equal('')
    expect(ansis.strip(stdout.output)).to.equal(
      // cspell:disable
      heredoc(`
        === ⛁ advanced-horizontal-01234 on ⬢ myapp

        Plan:       Advanced
        Status:     Available
        Data Size:  128.05 TB / 128.00 TB
        Tables:     4001 / 4000 (Not in compliance)
        PG Version: 17.5
        Rollback:   Unsupported
        Region:     us
        Created:    2025-01-01 00:00 UTC
        Quotas:      
          Storage:  128.05 TB (No quotas set)

        === Leader pool (attached as DATABASE)

          ✓ Available
          Connections: 10 / 400 used
          1 instance of 4G-Performance:
            leader.i3r507gt6dbscn: up

      `),
      // cspell:enable
    )
  })

  describe('data size', function () {
    it('renders N/A when plan limits info doesn\'t contain a storage limit', async function () {
      const info = {
        ...pgInfo,
        plan_limits: [],
      }

      dataApi
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, info)
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, multipleAttachmentsResponse)

      await runCommand(DataPgInfo, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output.replaceAll(/\s+/g, ' '))).to.include('Data Size: N/A')
    })

    it('renders N/A when storage limit is null', async function () {
      const info = {
        ...pgInfo,
        plan_limits: [{current: null, limit: 128_000, name: 'storage-limit-in-gb'}],
      }

      dataApi
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, info)
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, multipleAttachmentsResponse)

      await runCommand(DataPgInfo, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output.replaceAll(/\s+/g, ' '))).to.include('Data Size: N/A')
    })

    it('renders the data size when storage limit is present', async function () {
      const info = {
        ...pgInfo,
        plan_limits: [{current: 64_000, limit: 128_000, name: 'storage-limit-in-gb'}],
      }

      dataApi
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, info)
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, multipleAttachmentsResponse)

      await runCommand(DataPgInfo, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output)).to.include('64.00 TB / 128.00 TB')
    })
  })

  describe('quotas display', function () {
    it('renders the percent of quota used when the critical quota has been set', async function () {
      const info = {
        ...pgInfo,
        quotas: [{critical_gb: 128_000, current_gb: 64_000, type: 'storage'}],
      }

      dataApi
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, info)
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, multipleAttachmentsResponse)

      await runCommand(DataPgInfo, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output.replaceAll(/\s+/g, ' '))).to.include(
        'Storage: 64.00 TB / 128.00 TB (50.00%) (Within configured quotas)',
      )
    })

    it('renders the percent of quota used when there is no current usage', async function () {
      const info = {
        ...pgInfo,
        quotas: [{critical_gb: 128_000, current_gb: null, type: 'storage'}],
      }

      dataApi
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, info)
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, multipleAttachmentsResponse)

      await runCommand(DataPgInfo, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output.replaceAll(/\s+/g, ' '))).to.include(
        'Storage: 0.00 MB / 128.00 TB (Within configured quotas)',
      )
    })

    it('does not show the percent of quota used when no critical quota has been set', async function () {
      const info = {
        ...pgInfo,
        quotas: [{current_gb: 64_000, type: 'storage', warning_gb: 80_000}],
      }

      dataApi
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, info)
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, multipleAttachmentsResponse)

      await runCommand(DataPgInfo, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output.replaceAll(/\s+/g, ' '))).to.include(
        'Storage: 64.00 TB (Within configured quotas)',
      )
    })

    it('shows a compliance message when the quotas have not been exceeded', async function () {
      const info = {
        ...pgInfo,
        quotas: [{
          critical_gb: 128_000, current_gb: 64_000, type: 'storage', warning_gb: 80_000,
        }],
      }

      dataApi
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, info)
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, multipleAttachmentsResponse)

      await runCommand(DataPgInfo, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output.replaceAll(/\s+/g, ' '))).to.include(
        'Storage: 64.00 TB / 128.00 TB (50.00%) (Within configured quotas)',
      )
    })

    it('shows a compliance message when the warning quota has been exceeded', async function () {
      const info = {
        ...pgInfo,
        quotas: [{
          critical_gb: 128_000, current_gb: 64_000, type: 'storage', warning_gb: 60_000,
        }],
      }

      dataApi
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, info)
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, multipleAttachmentsResponse)

      await runCommand(DataPgInfo, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output.replaceAll(/\s+/g, ' '))).to.include(
        'Storage: 64.00 TB / 128.00 TB (50.00%) (Exceeded configured warning quota)',
      )
    })

    it('shows a compliance message when the critical quota been exceeded', async function () {
      const info = {
        ...pgInfo,
        quotas: [{
          critical_gb: 50_000, current_gb: 64_000, type: 'storage', warning_gb: 40_000,
        }],
      }

      dataApi
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, info)
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, multipleAttachmentsResponse)

      await runCommand(DataPgInfo, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output.replaceAll(/\s+/g, ' '))).to.include(
        'Storage: 64.00 TB / 50.00 TB (128.00%) (Exceeded configured critical quota)',
      )
    })
  })

  describe('error handling', function () {
    it('errors when used with non-advanced addons', async function () {
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])

      try {
        await runCommand(DataPgInfo, ['advanced-horizontal-01234', '--app=myapp'])
      } catch (error: unknown) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.equal(heredoc`
            You can only use this command on Advanced-tier databases.
            Run heroku pg:info ${nonAdvancedAddon.name} -a myapp instead.`,
        )
      }
    })
  })
})
