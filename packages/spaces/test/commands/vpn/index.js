'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
// const nock = require('nock')
const cmd = require('../../../commands/vpn/index')
// const expect = require('chai').expect

describe('spaces:vpn:connections', function () {
  beforeEach(() => cli.mockConsole())

  it('displays VPN Connections', function () {
    return cmd.run({flags: {
      space: 'my-space'
    }})
  })
})
