'use strict'
/* globals beforeEach */

const nock = require('nock')
const cmd = require('../../../../commands/vpn/info')
const expect = require('chai').expect
const cli = require('@heroku/heroku-cli-util')

describe('spaces:vpn:info', function () {
  beforeEach(() => cli.mockConsole())

  it('gets VPN info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        status: 'failed',
        status_message: 'supplied CIDR block already in use',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.197', // The one needed right now
            customer_ip: '52.44.146.198',
            status: 'UP',
            status_message: 'status message',
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.197',
            customer_ip: '52.44.146.198',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })
    return cmd.run({flags: {
      space: 'my-space',
      name: 'vpn-connection-name',
    }})
      .then(() => expect(cli.stdout).to.equal(
        `=== vpn-connection-name VPN Info
Name:           vpn-connection-name
ID:             123456789012
Public IP:      35.161.69.30
Routable CIDRs: 172.16.0.0/16
Status:         failed
Status Message: supplied CIDR block already in use
=== vpn-connection-name VPN Tunnel Info
VPN Tunnel  IP Address     Status  Status Last Changed   Details
──────────  ─────────────  ──────  ────────────────────  ──────────────
Tunnel 1    52.44.146.197  UP      2016-10-25T22:09:05Z  status message
Tunnel 2    52.44.146.197  UP      2016-10-25T22:09:05Z  status message\n`,
      ))
      .then(() => api.done())
  })

  it('gets VPN info in JSON', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name')
      .reply(200, {
        id: '123456789012',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        state: 'pending',
        status: 'failed',
        status_message: 'supplied CIDR block already in use',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.197',
            customer_ip: '52.44.146.197',
            status: 'UP',
            status_message: 'status message',
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.197',
            customer_ip: '52.44.146.197',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })
    return cmd.run({flags: {
      space: 'my-space',
      name: 'vpn-connection-name',
      json: true,
    }})
      .then(() => expect(cli.stdout).to.equal(
        `{
  "id": "123456789012",
  "public_ip": "35.161.69.30",
  "routable_cidrs": [
    "172.16.0.0/16"
  ],
  "state": "pending",
  "status": "failed",
  "status_message": "supplied CIDR block already in use",
  "tunnels": [
    {
      "last_status_change": "2016-10-25T22:09:05Z",
      "ip": "52.44.146.197",
      "customer_ip": "52.44.146.197",
      "status": "UP",
      "status_message": "status message"
    },
    {
      "last_status_change": "2016-10-25T22:09:05Z",
      "ip": "52.44.146.197",
      "customer_ip": "52.44.146.197",
      "status": "UP",
      "status_message": "status message"
    }
  ]
}\n`))
      .then(() => api.done())
  })
  it('gets VPN info with id', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/123456789012')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        status: 'failed',
        status_message: 'supplied CIDR block already in use',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.197', // The one needed right now
            customer_ip: '52.44.146.198',
            status: 'UP',
            status_message: 'status message',
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.197',
            customer_ip: '52.44.146.198',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })
    return cmd.run({flags: {
      space: 'my-space',
      name: '123456789012',
    }})
      .then(() => expect(cli.stdout).to.equal(
        `=== vpn-connection-name VPN Info
Name:           vpn-connection-name
ID:             123456789012
Public IP:      35.161.69.30
Routable CIDRs: 172.16.0.0/16
Status:         failed
Status Message: supplied CIDR block already in use
=== vpn-connection-name VPN Tunnel Info
VPN Tunnel  IP Address     Status  Status Last Changed   Details
──────────  ─────────────  ──────  ────────────────────  ──────────────
Tunnel 1    52.44.146.197  UP      2016-10-25T22:09:05Z  status message
Tunnel 2    52.44.146.197  UP      2016-10-25T22:09:05Z  status message\n`,
      ))
      .then(() => api.done())
  })
})
