'use strict'
/* globals describe it */

let expect = require('chai').expect
let format = require('../../lib/format')()

describe('CIDRBlocksOrCIDRBlock', function () {
  it('formats an array of cidrs', function () {
    return expect(format.CIDRBlocksOrCIDRBlock(['a', 'b'])).to.eq('a, b')
  })

  it('formats an array with a single cidr', function () {
    return expect(format.CIDRBlocksOrCIDRBlock(['a'])).to.eq('a')
  })

  it('falls back to extracting cidr_block from the fallback row when undefined', function () {
    let peer = {
      cidr_block: 'a'
    }
    return expect(format.CIDRBlocksOrCIDRBlock(undefined, peer)).to.eq('a')
  })

  it('falls back to extracting cidr_block from the fallback row when empty array', function () {
    let peer = {
      cidr_block: 'a'
    }
    return expect(format.CIDRBlocksOrCIDRBlock([], peer)).to.eq('a')
  })
})

describe('Percent', function () {
  it('formats a truthy number', function () {
    return expect(format.Percent(100)).to.eq('100%')
  })

  it('formats a falsey number', function () {
    return expect(format.Percent(0)).to.eq('0%')
  })

  it('formats a non-empty string', function () {
    return expect(format.Percent('100')).to.eq('100%')
  })

  it('does not format a empty string', function () {
    return expect(format.Percent('')).to.eq('')
  })

  it('does not format null', function () {
    return expect(format.Percent(null)).to.eq(null)
  })

  it('does not format undefined', function () {
    return expect(format.Percent(undefined)).to.eq(undefined)
  })
})
