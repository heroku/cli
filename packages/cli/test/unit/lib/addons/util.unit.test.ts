import * as util from '../../../../src/lib/addons/util'
import {expect} from 'chai'

describe('util.formatPrice', function () {
  it('formats as "free" when cents is 0', function () {
    expect(util.formatPrice({price: {cents: 0}, hourly: false})).to.eq('free')
    expect(util.formatPrice({price: {cents: 0}, hourly: true})).to.eq('free')
  })

  it('formats as "contract" when price.contract is truthy', function () {
    expect(util.formatPrice({price: {cents: 0, contract: true}, hourly: false})).to.eq('contract')
    expect(util.formatPrice({price: {cents: 0, contract: true}, hourly: true}))
  })

  it('returns undefined when no pricing information given', function () {
    expect(util.formatPrice({price: null})).to.be.undefined
  })

  describe('when displaying hourly price', function () {
    it('formats as dollars with cents with 3 decimals', function () {
      expect(util.formatPrice({price: {cents: 1200}, hourly: true})).to.eq('~$0.017/hour')
    })
  })

  describe('when displaying monthly price', function () {
    it('formats as dollars with cents when the calculated price is not whole dollars', function () {
      expect(util.formatPrice({price: {cents: 1200, unit: 'month'}, hourly: false})).to.eq('$12/month')
    })

    it('formats as dollars without cents when the calculated price is whole dollars', function () {
      expect(util.formatPrice({price: {cents: 720000, unit: 'month'}, hourly: false})).to.eq('$7200/month')
    })
  })
})
