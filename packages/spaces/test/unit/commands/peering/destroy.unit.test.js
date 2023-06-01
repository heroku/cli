'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmd = require('../../../../commands/peering/destroy')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

describe('spaces:peerings:destroy', function () {
  beforeEach(() => cli.mockConsole())

  it('destroys an active peering connection', function () {
    let api = nock('https://api.heroku.com:443')
      .delete('/spaces/my-space/peerings/pcx-12345')
      .reply(202)
    return cmd.run({flags: {space: 'my-space', pcxid: 'pcx-12345', confirm: 'pcx-12345'}})
      .then(() => expect(cli.stdout).to.equal(
        'Tearing down peering connection pcx-12345\n'))
      .then(() => api.done())
  })
})
