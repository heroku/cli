'use strict'
/* globals describe beforeEach it */

const nock = require('nock')
const cmd = require('../../../commands/vpn/config')
const expect = require('chai').expect
const cli = require('heroku-cli-util')

let response = {
  ipsec_tunnels: [
    {
      customer_gateway: {
        outside_address: { ip_address: '52.44.146.197' },
        inside_address: { ip_address: '52.44.146.198' }
      },
      vpn_gateway: {
        outside_address: { ip_address: '52.44.146.197' },
        inside_address: { ip_address: '52.44.146.198' }
      },
      ike: { pre_shared_key: 'apresharedkey1' }
    },
    {
      customer_gateway: {
        outside_address: { ip_address: '52.44.146.196' },
        inside_address: { ip_address: '52.44.146.198' }
      },
      vpn_gateway: {
        outside_address: { ip_address: '52.44.146.196' },
        inside_address: { ip_address: '52.44.146.198' }
      },
      ike: { pre_shared_key: 'apresharedkey2' }
    }
  ],
  full_space_cidr_block: '10.0.0.0/16',
  ike_version: 1
}

describe('spaces:vpn:config', function () {
  beforeEach(() => cli.mockConsole())

  it('gets VPN config', function () {
    let api = nock('https://api.heroku.com:443')
            .get('/spaces/my-space/vpn/config')
            .reply(200, response)
    return cmd.run({flags: {
      space: 'my-space'
    }})
            .then(() => expect(cli.stdout).to.equal(
            `=== my-space VPNs
VPN Tunnel  Customer Gateway  VPN Gateway    Pre-shared Key  Routable Subnets  IKE Version
──────────  ────────────────  ─────────────  ──────────────  ────────────────  ───────────
Tunnel 1    52.44.146.197     52.44.146.197  apresharedkey1  10.0.0.0/16       1
Tunnel 2    52.44.146.196     52.44.146.196  apresharedkey2  10.0.0.0/16       1\n`))
    .then(() => api.done())
  })

  it('gets VPN config in JSON', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn/config')
      .reply(200, response)
    return cmd.run({flags: {
      space: 'my-space',
      json: true
    }})
      .then(() => expect(cli.stdout).to.equal(
        `{
  "ipsec_tunnels": [
    {
      "customer_gateway": {
        "outside_address": {
          "ip_address": "52.44.146.197"
        },
        "inside_address": {
          "ip_address": "52.44.146.198"
        }
      },
      "vpn_gateway": {
        "outside_address": {
          "ip_address": "52.44.146.197"
        },
        "inside_address": {
          "ip_address": "52.44.146.198"
        }
      },
      "ike": {
        "pre_shared_key": "apresharedkey1"
      }
    },
    {
      "customer_gateway": {
        "outside_address": {
          "ip_address": "52.44.146.196"
        },
        "inside_address": {
          "ip_address": "52.44.146.198"
        }
      },
      "vpn_gateway": {
        "outside_address": {
          "ip_address": "52.44.146.196"
        },
        "inside_address": {
          "ip_address": "52.44.146.198"
        }
      },
      "ike": {
        "pre_shared_key": "apresharedkey2"
      }
    }
  ],
  "full_space_cidr_block": "10.0.0.0/16",
  "ike_version": 1
}\n`))
     .then(() => api.done())
  })
})
