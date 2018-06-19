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
