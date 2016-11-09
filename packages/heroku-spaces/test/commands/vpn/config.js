'use strict'
/* globals describe beforeEach it */

const nock = require('nock')
const cmd = require('../../../commands/vpn/config')
const expect = require('chai').expect
const cli = require('heroku-cli-util')

describe('spaces:vpn:config', function () {
  beforeEach(() => cli.mockConsole())

  it('gets VPN config', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn/config')
      .reply(200, {
        vpn_id: '123456789012'
      })
    return cmd.run({flags: {
      space: 'my-space'
    }})
      .then(() => expect(cli.stdout).to.equal(
        `{
  "vpn_id": "123456789012"
}\n`))
     .then(() => api.done())
  })
})
