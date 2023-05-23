'use strict'
/* globals beforeEach */

const nock = require('nock')
const cmd = require('../../../commands/vpn/config')
const expect = require('chai').expect
const cli = require('heroku-cli-util')

let vpnResponse = {
  id: '123456789012',
  name: 'vpn-connection-name-config',
  public_ip: '35.161.69.30',
  routable_cidrs: ['172.16.0.0/16'],
  ike_version: 1,
  space_cidr_block: '10.0.0.0/16',
  status: 'failed',
  status_message: 'supplied CIDR block already in use',
  tunnels: [
    {
      last_status_change: '2016-10-25T22:09:05Z',
      ip: '52.44.146.196', // The one needed right now
      customer_ip: '52.44.146.197',
      pre_shared_key: 'apresharedkey1',
      status: 'UP',
      status_message: 'status message',
    },
    {
      last_status_change: '2016-10-25T22:09:05Z',
      ip: '52.44.146.198',
      customer_ip: '52.44.146.199',
      pre_shared_key: 'apresharedkey2',
      status: 'UP',
      status_message: 'status message',
    },
  ],
}

describe('spaces:vpn:config', function () {
  beforeEach(() => cli.mockConsole())

  it('gets VPN config', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-config')
      .reply(200, vpnResponse)
    return cmd.run({flags: {
      space: 'my-space',
      name: 'vpn-connection-name-config',
    }})
      .then(() => expect(cli.stdout).to.equal(
        `=== vpn-connection-name-config VPN Tunnels
VPN Tunnel  Customer Gateway  VPN Gateway    Pre-shared Key  Routable Subnets  IKE Version
──────────  ────────────────  ─────────────  ──────────────  ────────────────  ───────────
Tunnel 1    52.44.146.197     52.44.146.196  apresharedkey1  10.0.0.0/16       1
Tunnel 2    52.44.146.199     52.44.146.198  apresharedkey2  10.0.0.0/16       1\n`))
      .then(() => api.done())
  })

  it('gets VPN config in JSON', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-config')
      .reply(200, vpnResponse)
    return cmd.run({flags: {
      space: 'my-space',
      name: 'vpn-connection-name-config',
      json: true,
    }})
      .then(() => expect(cli.stdout).to.equal(
        `{
  "id": "123456789012",
  "name": "vpn-connection-name-config",
  "public_ip": "35.161.69.30",
  "routable_cidrs": [
    "172.16.0.0/16"
  ],
  "ike_version": 1,
  "space_cidr_block": "10.0.0.0/16",
  "status": "failed",
  "status_message": "supplied CIDR block already in use",
  "tunnels": [
    {
      "last_status_change": "2016-10-25T22:09:05Z",
      "ip": "52.44.146.196",
      "customer_ip": "52.44.146.197",
      "pre_shared_key": "apresharedkey1",
      "status": "UP",
      "status_message": "status message"
    },
    {
      "last_status_change": "2016-10-25T22:09:05Z",
      "ip": "52.44.146.198",
      "customer_ip": "52.44.146.199",
      "pre_shared_key": "apresharedkey2",
      "status": "UP",
      "status_message": "status message"
    }
  ]
}\n`))
      .then(() => api.done())
  })
})
