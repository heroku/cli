import {expect} from 'chai'
import {displayCIDR, hostStatus, peeringStatus, displayVPNStatus} from '../../../../src/lib/spaces/format'

describe('displayCIDR', function () {
  it('formats an array of cidrs', function () {
    return expect(displayCIDR(['a', 'b'])).to.eq('a, b')
  })

  it('formats an array with a single cidr', function () {
    return expect(displayCIDR(['a'])).to.eq('a')
  })

  it('returns empty string if cidr has no value', function () {
    // eslint-disable-next-line unicorn/no-useless-undefined
    return expect(displayCIDR(undefined)).to.eq('')
  })
})

describe('hostStatus', function () {
  it('returns ANSI colorized host status if status meets switch statement condition, uncolorized value if it does not', function () {
    expect(hostStatus('available')).to.eq('\u001B[32mavailable\u001B[39m')
    expect(hostStatus('under-assessment')).to.eq('\u001B[33munder-assessment\u001B[39m')
    expect(hostStatus('permanent-failure')).to.eq('\u001B[31mpermanent-failure\u001B[39m')
    expect(hostStatus('released-permanent-failure')).to.eq('\u001B[31mreleased-permanent-failure\u001B[39m')
    expect(hostStatus('released')).to.eq('\u001B[2mreleased\u001B[22m')
    expect(hostStatus('foo')).to.eq('foo')
  })
})

describe('displayVPNStatus', function () {
  it('returns ANSI colorized VPN status if status meets switch statement condition, uncolorized value if it does not', function () {
    expect(displayVPNStatus('UP')).to.eq('\u001B[32mUP\u001B[39m')
    expect(displayVPNStatus('available')).to.eq('\u001B[32mavailable\u001B[39m')
    expect(displayVPNStatus('pending')).to.eq('\u001B[33mpending\u001B[39m')
    expect(displayVPNStatus('provisioning')).to.eq('\u001B[33mprovisioning\u001B[39m')
    expect(displayVPNStatus('deprovisioning')).to.eq('\u001B[33mdeprovisioning\u001B[39m')
    expect(displayVPNStatus('DOWN')).to.eq('\u001B[31mDOWN\u001B[39m')
    expect(displayVPNStatus('deleting')).to.eq('\u001B[31mdeleting\u001B[39m')
    expect(displayVPNStatus('deleted')).to.eq('\u001B[31mdeleted\u001B[39m')
    expect(displayVPNStatus('foo')).to.eq('foo')
  })
})

describe('peeringStatus', function () {
  it('returns ANSI colorized peering status if status meets switch statement condition, uncolorized value if it does not', function () {
    expect(peeringStatus('active')).to.eq('\u001B[32mactive\u001B[39m')
    expect(peeringStatus('pending-acceptance')).to.eq('\u001B[33mpending-acceptance\u001B[39m')
    expect(peeringStatus('provisioning')).to.eq('\u001B[33mprovisioning\u001B[39m')
    expect(peeringStatus('expired')).to.eq('\u001B[31mexpired\u001B[39m')
    expect(peeringStatus('failed')).to.eq('\u001B[31mfailed\u001B[39m')
    expect(peeringStatus('deleted')).to.eq('\u001B[31mdeleted\u001B[39m')
    expect(peeringStatus('rejected')).to.eq('\u001B[31mrejected\u001B[39m')
    expect(peeringStatus('foo')).to.eq('foo')
  })
})

