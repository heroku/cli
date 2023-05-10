'use strict'
/* globals beforeEach */

const nock = require('nock')
const cmd = require('../../../commands/vpn/connect')
const expect = require('chai').expect
const cli = require('heroku-cli-util')
const unwrap = require('../../unwrap')

describe('spaces:vpn:connect', function () {
  beforeEach(() => cli.mockConsole())

  it('creates VPN', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces/my-space/vpn-connections', {
        name: 'office',
        public_ip: '192.168.0.1',
        routable_cidrs: ['192.168.0.1/16', '192.168.0.2/16'],
      })
      .reply(201)
    return cmd.run({flags: {
      name: 'office',
      space: 'my-space',
      ip: '192.168.0.1',
      cidrs: '192.168.0.1/16,192.168.0.2/16',
    }})
      .then(() => expect(unwrap(cli.stderr)).to.equal(
        'Creating VPN Connection in space my-space... done Use spaces:vpn:wait to track allocation.\n'))
      .then(() => api.done())
  })
})
