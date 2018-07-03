'use strict'
/* globals describe beforeEach it */

const nock = require('nock')
const cmd = require('../../../commands/vpn/wait')
const expect = require('chai').expect
const cli = require('heroku-cli-util')

describe('spaces:vpn:wait', function () {
  beforeEach(() => cli.mockConsole())

  it('waits for VPN to allocate and then shows space config', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn')
      .reply(200)
      .get('/spaces/my-space/vpn')
      .reply(200, {
        id: '123456789012',
        public_ip: '35.161.69.30',
        routable_cidrs: [ '172.16.0.0/16' ],
        state: 'pending',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            outside_ip_address: '52.44.146.197',
            status: 'UP',
            status_message: 'status message'
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            outside_ip_address: '52.44.146.197',
            status: 'UP',
            status_message: 'status message'
          }
        ]
      })
      .get('/spaces/my-space/vpn')
      .reply(200, {
        id: '123456789012',
        public_ip: '35.161.69.30',
        routable_cidrs: [ '172.16.0.0/16' ],
        state: 'available',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            outside_ip_address: '52.44.146.197',
            status: 'UP',
            status_message: 'status message'
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            outside_ip_address: '52.44.146.197',
            status: 'UP',
            status_message: 'status message'
          }
        ]
      })
      .get('/spaces/my-space/vpn/config')
      .reply(200, {
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
      })

    return cmd.run({flags: {space: 'my-space', interval: 0}})
      .then(() => expect(cli.stderr).to.equal(
        `Waiting for VPN in space my-space to allocate... done\n\n`))
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space VPNs
VPN Tunnel  Customer Gateway  VPN Gateway    Pre-shared Key  Routable Subnets  IKE Version
──────────  ────────────────  ─────────────  ──────────────  ────────────────  ───────────
Tunnel 1    52.44.146.197     52.44.146.197  apresharedkey1  10.0.0.0/16       1
Tunnel 2    52.44.146.196     52.44.146.196  apresharedkey2  10.0.0.0/16       1\n`
      ))
      .then(() => api.done())
  })

  it('returns an error if the VPN status is updated to failed', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn')
      .reply(200)
      .get('/spaces/my-space/vpn')
      .reply(200, {
        id: '123456789012',
        public_ip: '35.161.69.30',
        routable_cidrs: [ '172.16.0.0/16' ],
        state: 'pending',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            outside_ip_address: '52.44.146.197',
            status: 'UP',
            status_message: 'status message'
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            outside_ip_address: '52.44.146.197',
            status: 'UP',
            status_message: 'status message'
          }
        ]
      })
      .get('/spaces/my-space/vpn')
      .reply(200, {
        id: '123456789012',
        public_ip: '35.161.69.30',
        routable_cidrs: [ '172.16.0.0/16' ],
        state: 'deleted',
        status: 'failed',
        status_message: 'supplied CIDR block already in use',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            outside_ip_address: '52.44.146.197',
            status: 'UP',
            status_message: 'status message'
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            outside_ip_address: '52.44.146.197',
            status: 'UP',
            status_message: 'status message'
          }
        ]
      })

    return cmd.run({flags: {space: 'my-space', interval: 0}})
      .catch(reason => {
        expect(reason.message).to.equal('supplied CIDR block already in use')
      })
      .then(() => api.done())
  })
})
