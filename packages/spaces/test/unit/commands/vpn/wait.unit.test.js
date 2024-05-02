'use strict'
/* globals beforeEach */

const nock = require('nock')
const cmd = require('../../../../commands/vpn/wait')
const expect = require('chai').expect
const cli = require('@heroku/heroku-cli-util')

describe('spaces:vpn:wait', function () {
  beforeEach(() => cli.mockConsole())

  it('waits for VPN to allocate and then shows space config', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200)
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        space_cidr_block: '10.0.0.0/16',
        status: 'pending',
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
      })
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        space_cidr_block: '10.0.0.0/16',
        status: 'active',
        status_message: '',
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
      })
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        space_cidr_block: '10.0.0.0/16',
        status: 'active',
        status_message: '',
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
      })

    return cmd.run({flags: {space: 'my-space', name: 'vpn-connection-name-wait', interval: 0}})
      .then(() => expect(cli.stderr).to.equal(
        'Waiting for VPN Connection vpn-connection-name-wait to allocate... done\n\n'))
      .then(() => expect(cli.stdout).to.equal(
        `=== vpn-connection-name-wait VPN Tunnels
VPN Tunnel  Customer Gateway  VPN Gateway    Pre-shared Key  Routable Subnets  IKE Version
──────────  ────────────────  ─────────────  ──────────────  ────────────────  ───────────
Tunnel 1    52.44.146.197     52.44.146.196  apresharedkey1  10.0.0.0/16       1
Tunnel 2    52.44.146.199     52.44.146.198  apresharedkey2  10.0.0.0/16       1\n`,
      ))
      .then(() => api.done())
  })

  it('returns an error if the VPN status is updated to failed', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200)
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-config',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        space_cidr_block: '10.0.0.0/16',
        status: 'pending',
        status_message: '',
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
      })
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-wait',
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
      })

    return cmd.run({flags: {space: 'my-space', name: 'vpn-connection-name-wait', interval: 0}})
      .catch(error => {
        expect(error.message).to.equal('supplied CIDR block already in use')
      })
      .then(() => api.done())
  })

  it('tells the user if the VPN has been allocated', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-allocated')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-config',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        space_cidr_block: '10.0.0.0/16',
        status: 'active',
        status_message: '',
      })

    return cmd.run({flags: {space: 'my-space', name: 'vpn-connection-allocated', interval: 0}})
      .then(() => expect(cli.stdout).to.equal(
        'VPN has been allocated.\n'))
      .then(() => api.done())
  })
})
