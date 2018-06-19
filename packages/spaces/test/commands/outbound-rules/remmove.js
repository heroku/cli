'use strict'
/* globals describe it beforeEach */

let nock = require('nock')
let cmd = require('../../../commands/outbound-rules/remove')
let cli = require('heroku-cli-util')

describe('outbound-rules:remove', function () {
  beforeEach(() => cli.mockConsole())

  it('removes a rule entry from the outbound rules', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.0.1/20', from_port: 443, to_port: 443, protocol: 'udp'}
        ]
      }
    )
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'}
        ]
      })
      .reply(200, {rules: []})
    return cmd.run({args: {ruleNumber: 2}, flags: {space: 'my-space', confirm: 'my-space'}})
      .then(() => api.done())
  })
})
