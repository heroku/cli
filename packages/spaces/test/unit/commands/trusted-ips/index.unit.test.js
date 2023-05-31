'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmd = require('../../../../commands/trusted-ips')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

let now = new Date()

describe('trusted-ips', function () {
  beforeEach(() => cli.mockConsole())

  it('shows the trusted IP ranges', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        version: '1',
        default_action: 'allow',
        created_at: now,
        created_by: 'dickeyxxx',
        rules: [
          {source: '127.0.0.1/20', action: 'allow'},
        ],
      })
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== Trusted IP Ranges
127.0.0.1/20
`))
      .then(() => api.done())
  })

  it('shows the trusted IP ranges with blank rules', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        version: '1',
        default_action: 'allow',
        created_at: now,
        created_by: 'dickeyxxx',
        rules: [],
      })
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space has no trusted IP ranges. All inbound web requests to dynos are blocked.
`))
      .then(() => api.done())
  })

  it('shows the trusted IP ranges --json', function () {
    let ruleSet = {
      version: '1',
      default_action: 'allow',
      created_at: now.toISOString(),
      created_by: 'dickeyxxx',
      rules: [
        {source: '127.0.0.1/20', action: 'allow'},
      ],
    }

    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, ruleSet)

    return cmd.run({flags: {space: 'my-space', json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(ruleSet))
      .then(() => api.done())
  })
})
