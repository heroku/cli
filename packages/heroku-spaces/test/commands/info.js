'use strict'
/* globals describe beforeEach it */

let nock = require('nock')
let cmd = require('../../commands/info')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

let now = new Date()

describe('spaces:info', function () {
  beforeEach(() => cli.mockConsole())

  it('shows space info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200,
        {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region'}, state: 'enabled', created_at: now}
    )
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Organization: my-org
Region:       my-region
State:        enabled
Created at:   ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('shows space info --json', function () {
    let space = {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region'}, state: 'enabled', created_at: now.toISOString()}

    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, space)

    return cmd.run({flags: {space: 'my-space', json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(space))
      .then(() => api.done())
  })

  it('shows allocated space with enabled nat', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200,
        {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region'}, state: 'allocated', created_at: now}
    )
    let outbound = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/nat')
      .reply(200,
        {state: 'enabled', sources: ['123.456.789.123']}
    )
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Organization: my-org
Region:       my-region
State:        allocated
Outbound IPs: 123.456.789.123
Created at:   ${now.toISOString()}
`))
      .then(() => outbound.done())
      .then(() => api.done())
  })

  it('shows allocated space with disabled nat', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200,
        {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region'}, state: 'allocated', created_at: now}
    )
    let outbound = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/nat')
      .reply(200,
        {state: 'disabled', sources: ['123.456.789.123']}
    )
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Organization: my-org
Region:       my-region
State:        allocated
Outbound IPs: disabled
Created at:   ${now.toISOString()}
`))
      .then(() => outbound.done())
      .then(() => api.done())
  })
})
