'use strict'
/* globals describe beforeEach it */

let nock = require('nock')
let cmd = require('../../commands/create')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

let now = new Date()

describe('spaces:create', function () {
  beforeEach(() => cli.mockConsole())

  it('creates a Standard space', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces', {
        name: 'my-space',
        organization: 'my-org',
        region: 'my-region',
        owner_pool: 'party'
      })
      .reply(201,
        {shield: false, name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region'}, features: [ 'one', 'two' ], state: 'enabled', created_at: now}
    )
    return cmd.run({org: 'my-org', flags: {space: 'my-space', region: 'my-region', features: 'one, two', 'owner-pool': 'party'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Organization: my-org
Region:       my-region
State:        enabled
Shield:       off
Created at:   ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('creates a Shield space', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces', {
        name: 'my-space',
        organization: 'my-org',
        region: 'my-region'
      })
      .reply(201,
        {shield: true, name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region'}, features: [ 'one', 'two' ], state: 'enabled', created_at: now}
    )
    return cmd.run({org: 'my-org', flags: {space: 'my-space', region: 'my-region', features: 'one, two'}, shield: true, log_drain_url: 'https://logs.cheetah.com'})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Organization: my-org
Region:       my-region
State:        enabled
Shield:       on
Created at:   ${now.toISOString()}
`))
      .then(() => api.done())
  })
})
