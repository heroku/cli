import {expect} from 'chai'

import {
  displayCIDR,
  displayVPNStatus,
  hostStatus,
  peeringStatus,
} from '../../../../src/lib/spaces/format.js'

describe('spaces/format', function () {
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
      expect(hostStatus('available')).to.eq('\u001B[38;5;40mavailable\u001B[39m')
      expect(hostStatus('under-assessment')).to.eq('\u001B[38;5;43munder-assessment\u001B[39m')
      expect(hostStatus('permanent-failure')).to.eq('\u001B[38;2;255;135;135mpermanent-failure\u001B[39m')
      expect(hostStatus('released-permanent-failure')).to.eq('\u001B[38;2;255;135;135mreleased-permanent-failure\u001B[39m')
      expect(hostStatus('released')).to.eq('\u001B[90mreleased\u001B[39m')
      expect(hostStatus('foo')).to.eq('foo')
    })
  })

  describe('displayVPNStatus', function () {
    it('returns ANSI colorized VPN status if status meets switch statement condition, uncolorized value if it does not', function () {
      expect(displayVPNStatus('UP')).to.eq('\u001B[38;5;40mUP\u001B[39m')
      expect(displayVPNStatus('available')).to.eq('\u001B[38;5;40mavailable\u001B[39m')
      expect(displayVPNStatus('pending')).to.eq('\u001B[38;5;43mpending\u001B[39m')
      expect(displayVPNStatus('provisioning')).to.eq('\u001B[38;5;43mprovisioning\u001B[39m')
      expect(displayVPNStatus('deprovisioning')).to.eq('\u001B[38;5;43mdeprovisioning\u001B[39m')
      expect(displayVPNStatus('DOWN')).to.eq('\u001B[38;2;255;135;135mDOWN\u001B[39m')
      expect(displayVPNStatus('deleting')).to.eq('\u001B[38;2;255;135;135mdeleting\u001B[39m')
      expect(displayVPNStatus('deleted')).to.eq('\u001B[38;2;255;135;135mdeleted\u001B[39m')
      expect(displayVPNStatus('foo')).to.eq('foo')
    })
  })

  describe('peeringStatus', function () {
    it('returns ANSI colorized peering status if status meets switch statement condition, uncolorized value if it does not', function () {
      expect(peeringStatus('active')).to.eq('\u001B[38;5;40mactive\u001B[39m')
      expect(peeringStatus('pending-acceptance')).to.eq('\u001B[38;5;43mpending-acceptance\u001B[39m')
      expect(peeringStatus('provisioning')).to.eq('\u001B[38;5;43mprovisioning\u001B[39m')
      expect(peeringStatus('expired')).to.eq('\u001B[38;2;255;135;135mexpired\u001B[39m')
      expect(peeringStatus('failed')).to.eq('\u001B[38;2;255;135;135mfailed\u001B[39m')
      expect(peeringStatus('deleted')).to.eq('\u001B[38;2;255;135;135mdeleted\u001B[39m')
      expect(peeringStatus('rejected')).to.eq('\u001B[38;2;255;135;135mrejected\u001B[39m')
      expect(peeringStatus('foo')).to.eq('foo')
    })
  })
})
