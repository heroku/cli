import {expect} from 'chai'
import {splitCsv} from '../../../../src/lib/spaces/parsers'

describe('splitCsv', function () {
  it('splits single value', function () {
    return expect(splitCsv('a')).to.deep.equal(['a'])
  })

  it('splits multiple values', function () {
    return expect(splitCsv('a,b')).to.deep.equal(['a', 'b'])
  })

  it('splits trims values', function () {
    return expect(splitCsv(' a , b ')).to.deep.equal(['a', 'b'])
  })

  it('removes empty component strings', function () {
    return expect(splitCsv('a,,c')).to.deep.equal(['a', 'c'])
  })

  it('returns empty array for null string', function () {
    return expect(splitCsv()).to.deep.equal([])
  })

  it('returns empty array for empty string', function () {
    return expect(splitCsv('')).to.deep.equal([])
  })
})
