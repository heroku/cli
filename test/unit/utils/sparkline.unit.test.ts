import {expect} from 'chai'

import {sparkline} from '../../../src/lib/utils/sparkline.js'

describe('sparkline', function () {
  it('generates sparkline for increasing values', function () {
    const result = sparkline([1, 2, 3, 4, 5])
    expect(result).to.be.a('string')
    expect(result.length).to.equal(5)
    expect(result).to.match(/^[▁▂▃▄▅▆▇█]+$/)
  })

  it('generates sparkline for decreasing values', function () {
    const result = sparkline([5, 4, 3, 2, 1])
    expect(result).to.be.a('string')
    expect(result.length).to.equal(5)
    expect(result).to.match(/^[▁▂▃▄▅▆▇█]+$/)
  })

  it('generates flat line for constant values', function () {
    const result = sparkline([3, 3, 3, 3, 3])
    expect(result).to.equal('▁▁▁▁▁')
  })

  it('handles mixed values', function () {
    const result = sparkline([1, 5, 2, 8, 3, 9, 1, 7])
    expect(result).to.be.a('string')
    expect(result.length).to.equal(8)
    expect(result).to.match(/^[▁▂▃▄▅▆▇█]+$/)
  })

  it('returns empty string for empty array', function () {
    const result = sparkline([])
    expect(result).to.equal('')
  })

  it('returns empty string for null/undefined', function () {
    expect(sparkline(null as any)).to.equal('')
    expect(sparkline(undefined as any)).to.equal('')
  })

  it('filters out non-numeric values', function () {
    const result = sparkline([1, 'invalid', 3, Number.NaN, 5] as any)
    expect(result).to.be.a('string')
    expect(result.length).to.equal(3)
    expect(result).to.match(/^[▁▂▃▄▅▆▇█]+$/)
  })

  it('handles single value', function () {
    const result = sparkline([42])
    expect(result).to.equal('▁')
  })

  it('handles negative values', function () {
    const result = sparkline([-5, -2, 0, 3, 7])
    expect(result).to.be.a('string')
    expect(result.length).to.equal(5)
    expect(result).to.match(/^[▁▂▃▄▅▆▇█]+$/)
  })

  it('renders fractional ranges at full resolution (does not collapse to a flat line)', function () {
    // Regression for #3919-adjacent bug: the old integer-truncating algorithm
    // floored inputs, so any range < 1 rendered as a flat '▁▁…' line.
    const result = sparkline([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8])
    expect(result).to.equal('▁▂▃▄▅▆▇█')
  })

  it('renders a sub-integer span instead of a flat line', function () {
    // Values all share the same integer part (12.x) — previously flattened to '▁▁▁'.
    const result = sparkline([12, 12.4, 12.9])
    expect(result).to.match(/^[▁▂▃▄▅▆▇█]{3}$/)
    expect(result).to.not.equal('▁▁▁')
    expect(result[0]).to.equal('▁')
    expect(result[2]).to.equal('█')
  })

  it('never emits "undefined" for fractional ranges (index stays in bounds)', function () {
    for (const range of [1 / 32, 0.0625, 0.125, 0.1875]) {
      const result = sparkline([0, range])
      expect(result, `range ${range}`).to.not.include('undefined')
      expect(result, `range ${range}`).to.match(/^[▁▂▃▄▅▆▇█]+$/)
    }
  })
})
