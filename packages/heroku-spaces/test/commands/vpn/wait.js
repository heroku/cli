'use strict'
/* globals describe beforeEach it */

const nock = require('nock')
const cmd = require('../../../commands/vpn/wait')
const expect = require('chai').expect
const cli = require('heroku-cli-util')

describe('spaces:vpn:wait', function () {
  beforeEach(() => cli.mockConsole())

  it('waits for VPN to allocate and then shows space info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn')
      .reply(422)
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

    return cmd.run({flags: {space: 'my-space', interval: 0}})
      .then(() => expect(cli.stderr).to.equal(
        `Waiting for VPN in space my-space to allocate... done\n\n`))
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space VPN Info
ID:             123456789012
Public IP:      35.161.69.30
Routable CIDRs: 172.16.0.0/16
State:          available
=== my-space Tunnel Info
VPN Tunnel  IP Address     Status  Status Last Changed   Details
──────────  ─────────────  ──────  ────────────────────  ──────────────
Tunnel 1    52.44.146.197  UP      2016-10-25T22:09:05Z  status message
Tunnel 2    52.44.146.197  UP      2016-10-25T22:09:05Z  status message\n`
      ))
      .then(() => api.done())
  })
})
