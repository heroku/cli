'use strict'
/* globals describe beforeEach it */

let nock = require('nock')
let cmd = require('../../../commands/trusted-ips/add')
let cli = require('heroku-cli-util')

describe('trusted-ips:add', function () {
  beforeEach(() => cli.mockConsole())

  it('adds a CIDR entry to the trusted IP ranges', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          { source: '128.0.0.1/20', action: 'allow' }
        ]
      })
      .put('/spaces/my-space/inbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          { source: '128.0.0.1/20', action: 'allow' },
          { source: '127.0.0.1/20', action: 'allow' }
        ]
      })
      .reply(200, { rules: [] })
    return cmd.run({ args: { source: '127.0.0.1/20' }, flags: { space: 'my-space' } })
      .then(() => api.done())
  })
})
