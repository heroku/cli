/* eslint-disable new-cap */
'use strict'

let expect = require('chai').expect
let format = require('../../../lib/format')()

describe('CIDRBlocksOrCIDRBlock', function () {
  it('formats an array of cidrs', function () {
    return expect(format.CIDRBlocksOrCIDRBlock(['a', 'b'])).to.eq('a, b')
  })

  it('formats an array with a single cidr', function () {
    return expect(format.CIDRBlocksOrCIDRBlock(['a'])).to.eq('a')
  })

  it('falls back to extracting cidr_block from the fallback row when undefined', function () {
    let peer = {
      cidr_block: 'a',
    }
    return expect(format.CIDRBlocksOrCIDRBlock(undefined, peer)).to.eq('a')
  })

  it('falls back to extracting cidr_block from the fallback row when empty array', function () {
    let peer = {
      cidr_block: 'a',
    }
    return expect(format.CIDRBlocksOrCIDRBlock([], peer)).to.eq('a')
  })
})

describe('CIDR', function () {
  it('returns empty string if cidr has no value', function () {
    return expect(format.CIDR()).to.eq('')
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
    return expect(format.Percent()).to.eq()
  })
})

describe('VPN Status', function () {
  it('returns VPN status if status meets switch statement condition', function () {
    expect(format.VPNStatus('pending')).to.eq('pending')
    expect(format.VPNStatus('provisioning')).to.eq('provisioning')
    expect(format.VPNStatus('deprovisioning')).to.eq('deprovisioning')
  })

  it('returns VPN status if status = "DOWN" or "deleting" or "deleted"', function () {
    expect(format.VPNStatus('DOWN')).to.eq('DOWN')
    expect(format.VPNStatus('deleting')).to.eq('deleting')
    expect(format.VPNStatus('deleted')).to.eq('deleted')
  })
})

describe('Peering Status', function () {
  it('returns peering status if default case is reached in switch statement', function () {
    return expect(format.PeeringStatus('foo')).to.eq('foo')
  })
})

describe('Host Status', function () {
  it('returns host status if status meets switch statement condition', function () {
    expect(format.HostStatus('under-assessment')).to.eq('under-assessment')
    expect(format.HostStatus('permanent-failure')).to.eq('permanent-failure')
    expect(format.HostStatus('released-permanent-failure')).to.eq('released-permanent-failure')
    expect(format.HostStatus('foo')).to.eq('foo')
  })
})
