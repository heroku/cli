'use strict'

let util = require('../../lib/util')
let expect = require('chai').expect

describe('util.formatPrice', function () {
  it('formats as "free" when cents is 0', function () {
    expect(util.formatPrice({cents: 0, unit: 'does not matter'})).to.eq('free')
  })

  it('formats cents per unit', function () {
    expect(util.formatPrice({cents: 100, unit: 'UNIT'})).to.eq('$1/UNIT')
  })

  it('formats as dollars with cents when not whole dollars', function () {
    expect(util.formatPrice({cents: 1201, unit: 'month'})).to.eq('$12.01/month')
  })

  it('formats as dollars without cents when whole dollars', function () {
    expect(util.formatPrice({cents: 1200, unit: 'month'})).to.eq('$12/month')
  })

  it('returns undefined when no pricing information given', function () {
    expect(util.formatPrice(null)).to.eq()
  })
})
