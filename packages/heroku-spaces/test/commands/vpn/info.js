'use strict'
/* globals describe beforeEach it */

const nock = require('nock')
const cmd = require('../../../commands/vpn/info')
const expect = require('chai').expect
const cli = require('heroku-cli-util')

describe('spaces:vpn:info', function () {
  beforeEach(() => cli.mockConsole())

  it('gets VPN info', function () {
    let api = nock('https://api.heroku.com:443')
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
    return cmd.run({flags: {
      space: 'my-space'
    }})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space VPN Info
ID:             123456789012
Public IP:      35.161.69.30
Routable CIDRs: 172.16.0.0/16
State:          pending
=== my-space Tunnel Info
VPN Tunnel  IP Address     Status  Status Last Changed   Details
──────────  ─────────────  ──────  ────────────────────  ──────────────
Tunnel 1    52.44.146.197  UP      2016-10-25T22:09:05Z  status message
Tunnel 2    52.44.146.197  UP      2016-10-25T22:09:05Z  status message\n`
      ))
     .then(() => api.done())
  })

  it('gets VPN info in JSON', function () {
    let api = nock('https://api.heroku.com:443')
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
    return cmd.run({flags: {
      space: 'my-space',
      json: true
    }})
      .then(() => expect(cli.stdout).to.equal(
        `{
  "id": "123456789012",
  "public_ip": "35.161.69.30",
  "routable_cidrs": [
    "172.16.0.0/16"
  ],
  "state": "pending",
  "tunnels": [
    {
      "last_status_change": "2016-10-25T22:09:05Z",
      "outside_ip_address": "52.44.146.197",
      "status": "UP",
      "status_message": "status message"
    },
    {
      "last_status_change": "2016-10-25T22:09:05Z",
      "outside_ip_address": "52.44.146.197",
      "status": "UP",
      "status_message": "status message"
    }
  ]
}\n`))
     .then(() => api.done())
  })
})
