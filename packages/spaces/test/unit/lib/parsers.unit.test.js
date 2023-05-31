'use strict'

let expect = require('chai').expect
let parsers = require('../../../lib/parsers')()

describe('splitCsv', function () {
  it('splits single value', function () {
    return expect(parsers.splitCsv('a')).to.deep.equal(['a'])
  })

  it('splits multiple values', function () {
    return expect(parsers.splitCsv('a,b')).to.deep.equal(['a', 'b'])
  })

  it('splits trims values', function () {
    return expect(parsers.splitCsv(' a , b ')).to.deep.equal(['a', 'b'])
  })

  it('removes empty component strings', function () {
    return expect(parsers.splitCsv('a,,c')).to.deep.equal(['a', 'c'])
  })

  it('returns empty array for null string', function () {
    return expect(parsers.splitCsv(null)).to.deep.equal([])
  })

  it('returns empty array for empty string', function () {
    return expect(parsers.splitCsv('')).to.deep.equal([])
  })
})
