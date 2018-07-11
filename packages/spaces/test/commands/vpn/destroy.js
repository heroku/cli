'use strict'
/* globals describe beforeEach it */

const nock = require('nock')
const cmd = require('../../../commands/vpn/destroy')
const expect = require('chai').expect
const cli = require('heroku-cli-util')

describe('spaces:vpn:destroy', function () {
  beforeEach(() => cli.mockConsole())

  it('destroys VPN Connection when name is specified', function () {
    let api = nock('https://api.heroku.com:443')
      .delete('/spaces/my-space/vpn-connections/my-vpn-connection')
      .reply(202)
    return cmd.run({args: {name: 'my-vpn-connection'}, flags: {space: 'my-space', confirm: 'my-space'}})
      .then(() => expect(cli.stderr).to.equal(
        `Tearing down VPN Connection in space my-space... done\n`))
      .then(() => api.done())
  })

  it('destroys VPN when no name is specified', function () {
    let api = nock('https://api.heroku.com:443')
    .delete('/spaces/my-space/vpn')
    .reply(202)
  return cmd.run({flags: {space: 'my-space', confirm: 'my-space'}})
    .then(() => expect(cli.stderr).to.equal(
      `Tearing down VPN Connection in space my-space... done\n`))
    .then(() => api.done())
  })
})
