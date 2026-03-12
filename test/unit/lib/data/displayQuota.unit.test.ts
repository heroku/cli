import {expect} from 'chai'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import {displayQuota, formatQuotaStatus} from '../../../../src/lib/data/displayQuota.js'
import {
  storageQuotaResponse, storageQuotaResponseCriticalNotify,
  storageQuotaResponseRestricted, storageQuotaResponseWarning,
} from '../../../fixtures/data/quotas.js'

const heredoc = tsheredoc.default

describe('lib/displayQuota', function () {
  describe('formatQuotaStatus', function () {
    it('indicates that the database is within configured quotas when usage is below the warning quota', function () {
      expect(formatQuotaStatus(storageQuotaResponse)).to.equal('0.00 MB / 100.00 GB (Within configured quotas)')
    })

    it('indicates that the database has surpassed the warning quota when usage is above the warning quota', function () {
      expect(formatQuotaStatus(storageQuotaResponseWarning)).to.equal('75.00 GB / 100.00 GB (75.00%) (Exceeded configured warning quota)')
    })

    it('indicates that the database has surpassed the critical quota when usage is above the critical quota and enforcement is not active', function () {
      expect(formatQuotaStatus(storageQuotaResponseCriticalNotify)).to.equal('150.00 GB / 100.00 GB (150.00%) (Exceeded configured critical quota)')
    })

    it('indicates that the database has been restricted when usage is above the critical quota and enforcement is active', function () {
      expect(formatQuotaStatus(storageQuotaResponseRestricted)).to.equal('150.00 GB / 100.00 GB (150.00%) (Restricted)')
    })
  })

  describe('displayQuota', function () {
    it('displays the quota information in a human-readable format', function () {
      stdout.start()
      displayQuota(storageQuotaResponse)
      stdout.stop()

      expect(stdout.output).to.equal(
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
})
