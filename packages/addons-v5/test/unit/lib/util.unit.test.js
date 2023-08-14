'use strict'

let util = require('../../../lib/util')
let expect = require('chai').expect

describe('util.formatPrice', function () {
  it('formats as "free" when cents is 0', function () {
    expect(util.formatPrice({cents: 0})).to.eq('free')
    expect(util.formatHourlyPrice({cents: 0})).to.eq('free')
  })

  it('formats as "contract" when price.contract is truthy', function () {
    expect(util.formatPrice({cents: 0, contract: true})).to.eq('contract')
    expect(util.formatHourlyPrice({cents: 0, contract: true}))
  })

  it('returns undefined when no pricing information given', function () {
    expect(util.formatPrice(null)).to.eq()
    expect(util.formatHourlyPrice(null)).to.eq()
  })

  describe('when displaying hourly price', function () {
    it('formats as dollars with cents when the calculated price is not whole dollars', function () {
      expect(util.formatHourlyPrice({cents: 1200})).to.eq('~$0.02/hour')
    })

    it('formats as dollars without cents when the calculated price is whole dollars', function () {
      expect(util.formatHourlyPrice({cents: 720000})).to.eq('~$10/hour')
    })
  })

  describe('when displaying monthly price', function () {
    it('formats as dollars with cents when the calculated price is not whole dollars', function () {
      expect(util.formatPrice({cents: 1200, unit: 'month'})).to.eq('$12/month')
    })

    it('formats as dollars without cents when the calculated price is whole dollars', function () {
      expect(util.formatPrice({cents: 720000, unit: 'month'})).to.eq('$7200/month')
    })
  })
})
