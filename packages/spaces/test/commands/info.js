'use strict'
/* globals describe beforeEach it */

let nock = require('nock')
let cmd = require('../../commands/info')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

let now = new Date()

describe('spaces:info', function () {
  beforeEach(() => cli.mockConsole())

  it('shows space info', async function () {
    let api = nock('https://api.heroku.com:443', { reqheaders: { 'Accept-Expansion': 'region' } })
      .get('/spaces/my-space')
      .reply(200,
        { shield: false, name: 'my-space', team: { name: 'my-team' }, region: { name: 'my-region', description: 'region' }, state: 'enabled', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20' }
      )

    await cmd.run({ flags: { space: 'my-space' } })

    expect(cli.stdout).to.equal(
      `=== my-space
Team:         my-team
Region:       region
CIDR:         10.0.0.0/16
Data CIDR:    172.23.0.0/20
State:        enabled
Shield:       off
Created at:   ${now.toISOString()}
`)

    return api.done()
  })

  it('shows space info --json', async function () {
    let space = { name: 'my-space', team: { name: 'my-team' }, region: { name: 'my-region' }, state: 'enabled', created_at: now.toISOString(), cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20' }

    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, space)

    await cmd.run({ flags: { space: 'my-space', json: true } })

    expect(JSON.parse(cli.stdout)).to.eql(space)

    return api.done()
  })

  it('shows allocated space with enabled nat', async function () {
    let api = nock('https://api.heroku.com:443', { reqheaders: { 'Accept-Expansion': 'region' } })
      .get('/spaces/my-space')
      .reply(200,
        { shield: false, name: 'my-space', team: { name: 'my-team' }, region: { name: 'my-region', description: 'region' }, state: 'allocated', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20' }
      )
    let outbound = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/nat')
      .reply(200,
        { state: 'enabled', sources: ['123.456.789.123'] }
      )

    await cmd.run({ flags: { space: 'my-space' } })

    expect(cli.stdout).to.equal(
      `=== my-space
Team:         my-team
Region:       region
CIDR:         10.0.0.0/16
Data CIDR:    172.23.0.0/20
State:        allocated
Shield:       off
Outbound IPs: 123.456.789.123
Created at:   ${now.toISOString()}
`)

    outbound.done()

    return api.done()
  })

  it('shows allocated space with disabled nat', async function () {
    let api = nock('https://api.heroku.com:443', { reqheaders: { 'Accept-Expansion': 'region' } })
      .get('/spaces/my-space')
      .reply(200,
        { shield: false, name: 'my-space', team: { name: 'my-team' }, region: { name: 'my-region', description: 'region' }, state: 'allocated', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20' }
      )
    let outbound = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/nat')
      .reply(200,
        { state: 'disabled', sources: ['123.456.789.123'] }
      )

    await cmd.run({ flags: { space: 'my-space' } })

    expect(cli.stdout).to.equal(
      `=== my-space
Team:         my-team
Region:       region
CIDR:         10.0.0.0/16
Data CIDR:    172.23.0.0/20
State:        allocated
Shield:       off
Outbound IPs: disabled
Created at:   ${now.toISOString()}
`)

    outbound.done()

    return api.done()
  })

  it('shows a space with Shield turned off', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200,
        { shield: false, name: 'my-space', team: { name: 'my-team' }, region: { name: 'my-region', description: 'region' }, state: 'enabled', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20' }
      )

    await cmd.run({ flags: { space: 'my-space' } })

    expect(cli.stdout).to.equal(
      `=== my-space
Team:         my-team
Region:       region
CIDR:         10.0.0.0/16
Data CIDR:    172.23.0.0/20
State:        enabled
Shield:       off
Created at:   ${now.toISOString()}
`)

    return api.done()
  })

  it('shows a space with Shield turned on', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200,
        { shield: true, name: 'my-space', team: { name: 'my-team' }, region: { name: 'my-region', description: 'region' }, state: 'enabled', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20' }
      )

    await cmd.run({ flags: { space: 'my-space' } })

    expect(cli.stdout).to.equal(
      `=== my-space
Team:         my-team
Region:       region
CIDR:         10.0.0.0/16
Data CIDR:    172.23.0.0/20
State:        enabled
Shield:       on
Created at:   ${now.toISOString()}
`)

    return api.done()
  })
})
