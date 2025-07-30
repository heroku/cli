import {expect} from 'chai'
import {sparkline} from '../../../src/lib/utils/sparkline.js'

describe('sparkline', () => {
  it('generates sparkline for increasing values', () => {
    const result = sparkline([1, 2, 3, 4, 5])
    expect(result).to.be.a('string')
    expect(result.length).to.equal(5)
    expect(result).to.match(/^[▁▂▃▄▅▆▇█]+$/)
  })

  it('generates sparkline for decreasing values', () => {
    const result = sparkline([5, 4, 3, 2, 1])
    expect(result).to.be.a('string')
    expect(result.length).to.equal(5)
    expect(result).to.match(/^[▁▂▃▄▅▆▇█]+$/)
  })

  it('generates flat line for constant values', () => {
    const result = sparkline([3, 3, 3, 3, 3])
    expect(result).to.equal('▁▁▁▁▁')
  })

  it('handles mixed values', () => {
    const result = sparkline([1, 5, 2, 8, 3, 9, 1, 7])
    expect(result).to.be.a('string')
    expect(result.length).to.equal(8)
    expect(result).to.match(/^[▁▂▃▄▅▆▇█]+$/)
  })

  it('returns empty string for empty array', () => {
    const result = sparkline([])
    expect(result).to.equal('')
  })

  it('returns empty string for null/undefined', () => {
    expect(sparkline(null as any)).to.equal('')
    expect(sparkline(undefined as any)).to.equal('')
  })

  it('filters out non-numeric values', () => {
    const result = sparkline([1, 'invalid', 3, Number.NaN, 5] as any)
    expect(result).to.be.a('string')
    expect(result.length).to.equal(3)
    expect(result).to.match(/^[▁▂▃▄▅▆▇█]+$/)
  })

  it('handles single value', () => {
    const result = sparkline([42])
    expect(result).to.equal('▁')
  })

  it('handles negative values', () => {
    const result = sparkline([-5, -2, 0, 3, 7])
    expect(result).to.be.a('string')
    expect(result.length).to.equal(5)
    expect(result).to.match(/^[▁▂▃▄▅▆▇█]+$/)
  })
})
