'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmd = require('../../../../commands/outbound-rules')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

let now = new Date()

describe('outbound-rules', function () {
  beforeEach(() => cli.mockConsole())

  it('shows the outbound rules', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        version: '1',
        created_at: now,
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== Outbound Rules
Rule Number  Destination   From Port  To Port  Protocol
───────────  ────────────  ─────────  ───────  ────────
1            128.0.0.1/20  80         80       tcp
`))
      .then(() => api.done())
  })

  it('shows the empty ruleset message when empty', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        version: '1',
        default_action: 'allow',
        created_at: now,
        created_by: 'dickeyxxx',
        rules: [],
      })
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space has no Outbound Rules. Your Dynos cannot communicate with hosts outside of my-space.
`))
      .then(() => api.done())
  })

  it('shows the outbound rules via JSON when --json is passed', function () {
    let ruleSet = {
      version: '1',
      default_action: 'allow',
      created_at: now.toISOString(),
      created_by: 'dickeyxxx',
      rules: [
        {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
      ],
    }

    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, ruleSet)

    return cmd.run({flags: {space: 'my-space', json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(ruleSet))
      .then(() => api.done())
  })
})
