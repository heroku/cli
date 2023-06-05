
/* eslint-env mocha */

const expect = require('chai').expect
const keyBy = require('../../../lib/key-by')
const couplings = [
  {
    app: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
    },
    pipeline: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
    },
  },
  {
    app: {
      id: '01234567-89ab-cdef-0123-456789abcde1',
    },
    pipeline: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
    },
  },
]

describe('key-by', function () {
  describe('#keyByAppId', function () {
    it('returns couplings based on app IDs', async function () {
      const couplingsWithAppIds = keyBy(couplings, coupling => coupling.app.id)
      expect(couplingsWithAppIds).to.have.keys(['01234567-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcde1'])
    })
  })
})
