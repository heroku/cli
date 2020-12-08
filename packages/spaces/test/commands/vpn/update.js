'use strict'
/* globals describe beforeEach it */

const nock = require('nock')
const cmd = require('../../../commands/vpn/update')
const expect = require('chai').expect
const cli = require('heroku-cli-util')
const unwrap = require('../../unwrap')

describe('spaces:vpn:update', function () {
  beforeEach(() => cli.mockConsole())

  it('updates VPN', function () {
    let api = nock('https://api.heroku.com:443')
      .patch('/spaces/my-space/vpn-connections/office', {
        routable_cidrs: ['192.168.0.1/16', '192.168.0.2/16']
      })
      .reply(201)
    return cmd.run({
      flags: {
        name: 'office',
        space: 'my-space',
        cidrs: '192.168.0.1/16,192.168.0.2/16'
      }
    })
      .then(() => expect(unwrap(cli.stderr)).to.equal(
        'Updating VPN Connection in space my-space... done\n'))
      .then(() => api.done())
  })
})
