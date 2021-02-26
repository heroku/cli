'use strict'
/* globals describe beforeEach it */

let nock = require('nock')
let cmd = require('../../../commands/trusted-ips')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

let now = new Date()

describe('trusted-ips', function () {
  beforeEach(() => cli.mockConsole())

  it('shows the trusted IP ranges', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        version: '1',
        default_action: 'allow',
        created_at: now,
        created_by: 'dickeyxxx',
        rules: [
          { source: '127.0.0.1/20', action: 'allow' }
        ]
      })

    await cmd.run({ flags: { space: 'my-space' } })

    expect(cli.stdout).to.equal(
      `=== Trusted IP Ranges
127.0.0.1/20
`)

    return api.done()
  })

  it('shows the trusted IP ranges with blank rules', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        version: '1',
        default_action: 'allow',
        created_at: now,
        created_by: 'dickeyxxx',
        rules: []
      })

    await cmd.run({ flags: { space: 'my-space' } })

    expect(cli.stdout).to.equal(
      `=== my-space has no trusted IP ranges. All inbound web requests to dynos are blocked.
`)

    return api.done()
  })

  it('shows the trusted IP ranges --json', async function () {
    let ruleSet = {
      version: '1',
      default_action: 'allow',
      created_at: now.toISOString(),
      created_by: 'dickeyxxx',
      rules: [
        { source: '127.0.0.1/20', action: 'allow' }
      ]
    }

    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, ruleSet)

    await cmd.run({ flags: { space: 'my-space', json: true } })

    expect(JSON.parse(cli.stdout)).to.eql(ruleSet)

    return api.done()
  })
})
