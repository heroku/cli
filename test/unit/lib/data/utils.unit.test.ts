import {expect} from 'chai'

import {renderTimestamp} from '../../../../src/lib/data/utils.js'

describe('lib/data/utils', function () {
  describe('renderTimestamp', function () {
    it('formats a timestamp in UTC to the minute', function () {
      expect(renderTimestamp('2026-10-21T11:00:59-05:00')).to.equal('2026-10-21 16:00 UTC')
    })

    it('returns a timestamp it can\'t parse unchanged', function () {
      expect(renderTimestamp('not a timestamp')).to.equal('not a timestamp')
    })
  })
})
