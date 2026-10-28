import {runCommand} from '@heroku-cli/test-utils'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import ansis from 'ansis'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgQuotasIndex from '../../../../../../src/commands/data/pg/quotas/index.js'
import {
  advancedAddon, quotasResponse, standardAddon, storageQuotaResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type FakeData = {
  postgresQuota: {info: SinonStub, list: SinonStub}
}

function buildFakeData(): FakeData {
  return {postgresQuota: {info: stub(), list: stub()}}
}

describe('data:pg:quotas', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  describe('without type flag', function () {
    it('returns info on all quotas', async function () {
      fakeData.postgresQuota.list.resolves({addon: advancedAddon, quotas: quotasResponse})

      const {stderr, stdout} = await runCommand(DataPgQuotasIndex, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      expect(stderr).to.equal('')
      expect(ansis.strip(stdout)).to.equal(heredoc(`
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
        
        `))
      expect(fakeData.postgresQuota.list.calledOnceWithExactly('advanced-horizontal-01234', {appIdentity: 'myapp'})).to.equal(true)
    })
  })

  describe('with type flag', function () {
    it('returns info only on the specified type of quota', async function () {
      fakeData.postgresQuota.info.resolves({addon: advancedAddon, quota: storageQuotaResponse})

      const {stderr, stdout} = await runCommand(DataPgQuotasIndex, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--type=storage',
      ])

      expect(stderr).to.equal('')
      expect(ansis.strip(stdout)).to.equal(heredoc(`
        === Storage

        Warning:            50.00 GB
        Critical:           100.00 GB
        Enforcement Action: None
        Status:             0.00 MB / 100.00 GB (Within configured quotas)
        `))
      expect(fakeData.postgresQuota.info.calledOnceWithExactly('advanced-horizontal-01234', 'storage', {appIdentity: 'myapp'})).to.equal(true)
      expect(fakeData.postgresQuota.list.called).to.equal(false)
    })
  })

  describe('error handling', function () {
    it('errors when used with non-Advanced-tier add-ons', async function () {
      fakeData.postgresQuota.list.rejects(new NotAdvancedDatabaseError(standardAddon, 'not an advanced-tier database'))

      const {error} = await runCommand(DataPgQuotasIndex, ['advanced-horizontal-01234', '--app=myapp'])
      const err = error as Error

      expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases')
    })
  })
})
