import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgQuotasIndex from '../../../../../../src/commands/data/pg/quotas/index.js'
import {
  addon,
  nonAdvancedAddon,
  quotasResponse,
  storageQuotaResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('data:pg:quotas', function () {
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

  describe('without type flag', function () {
    it('returns info on all quotas', async function () {
      dataApi
        .get(`/data/postgres/v1/${addon.id}/quotas`)
        .reply(200, quotasResponse)
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      await runCommand(DataPgQuotasIndex, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output)).to.equal(
        heredoc(`
        === Storage

        Warning:            Not set
        Critical:           Not set
        Enforcement Action: None
        Status:             1.10 GB (No quotas set)
        
        === Otherquota

        Warning:            50.00 GB
        Critical:           100.00 GB
        Enforcement Action: Notify
        Status:             1.10 GB / 100.00 GB (1.10%) (Within configured quotas)
        
        `),
      )
    })
  })

  describe('with type flag', function () {
    it('returns info only on the specified type of quota', async function () {
      dataApi
        .get(`/data/postgres/v1/${addon.id}/quotas/storage`)
        .reply(200, storageQuotaResponse)
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      await runCommand(DataPgQuotasIndex, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--type=storage',
      ])

      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output)).to.equal(
        heredoc(`
        === Storage

        Warning:            50.00 GB
        Critical:           100.00 GB
        Enforcement Action: None
        Status:             0.00 MB / 100.00 GB (Within configured quotas)
        `),
      )
    })
  })

  describe('error handling', function () {
    it('errors when used with non-Advanced-tier add-ons', async function () {
      herokuApi
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])

      try {
        await runCommand(DataPgQuotasIndex, ['advanced-horizontal-01234', '--app=myapp'])
      } catch (error: unknown) {
        const err = error as Error

        herokuApi.done()
        expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases')
      }
    })
  })
})
