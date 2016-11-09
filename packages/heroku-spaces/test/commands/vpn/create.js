'use strict'
/* globals describe beforeEach it */

const nock = require('nock')
const cmd = require('../../../commands/vpn/create')
const expect = require('chai').expect
const cli = require('heroku-cli-util')

describe('spaces:vpn:create', function () {
  beforeEach(() => cli.mockConsole())

  it('creates VPN', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces/my-space/vpn', {
        public_ip: '192.168.0.1',
        routable_cidrs: [ '192.168.0.1/16', '192.168.0.2/16' ]
      })
      .reply(201)
    return cmd.run({flags: {
      space: 'my-space',
      ip: '192.168.0.1',
      cidrs: '192.168.0.1/16,192.168.0.2/16'
    }})
      .then(() => expect(cli.stderr).to.equal(
        `Creating VPN in space my-space... done\n ▸    Use spaces:vpn:wait to track allocation.\n`))
      .then(() => api.done())
  })
})
