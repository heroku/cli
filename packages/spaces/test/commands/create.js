'use strict'
/* globals describe beforeEach it */

let nock = require('nock')
let cmd = require('../../commands/create')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

let now = new Date()
let features = [ 'one', 'two' ]

describe('spaces:create', function () {
  beforeEach(() => cli.mockConsole())

  it('creates a Standard space', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        owner_pool: 'party',
        features: features
      })
      .reply(201,
        {shield: false, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, features: [ 'one', 'two' ], state: 'enabled', created_at: now}
    )
    return cmd.run({team: 'my-team', flags: {space: 'my-space', region: 'my-region', features: 'one, two', 'owner-pool': 'party'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Team:       my-team
Region:     my-region
State:      enabled
Shield:     off
Created at: ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('shows Standard Private Space Add-on cost warning', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        owner_pool: 'party',
        features: features
      })
      .reply(201,
        {shield: false, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, features: [ 'one', 'two' ], state: 'enabled', created_at: now}
    )
    return cmd.run({team: 'my-team', flags: {space: 'my-space', region: 'my-region', features: 'one, two', 'owner-pool': 'party'}})
      .then(() => expect(cli.stderr).to.include(
        `Each Heroku Standard Private Space costs $1000`))
      .then(() => api.done())
  })

  it('creates a Shield space', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        features: features,
        shield: true
      })
      .reply(201,
        {shield: true, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, features: [ 'one', 'two' ], state: 'enabled', created_at: now}
    )
    return cmd.run({team: 'my-team', flags: {space: 'my-space', region: 'my-region', features: 'one, two', shield: true}, log_drain_url: 'https://logs.cheetah.com'})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Team:       my-team
Region:     my-region
State:      enabled
Shield:     on
Created at: ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('shows Shield Private Space Add-on cost warning', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        features: features,
        shield: true
      })
      .reply(201,
        {shield: true, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, features: [ 'one', 'two' ], state: 'enabled', created_at: now}
    )
    return cmd.run({team: 'my-team', flags: {space: 'my-space', region: 'my-region', features: 'one, two', shield: true}, log_drain_url: 'https://logs.cheetah.com'})
      .then(() => expect(cli.stderr).to.include(
        `Each Heroku Shield Private Space costs $3000`))
      .then(() => api.done())
  })

  it('creates a space with custom cidr', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        cidr: '10.0.0.0/16',
        features: features
      })
      .reply(201,
        {shield: false, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, features: [ 'one', 'two' ], state: 'enabled', created_at: now}
    )
    return cmd.run({team: 'my-team', flags: {space: 'my-space', region: 'my-region', features: 'one, two', cidr: '10.0.0.0/16'}, shield: true, log_drain_url: 'https://logs.cheetah.com'})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Team:       my-team
Region:     my-region
State:      enabled
Shield:     off
Created at: ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('create fails without team name', function (done) {
    cmd.run({flags: {space: 'my-space', region: 'my-region'}})
      .catch(reason => {
        expect(reason.message).to.equal('No team specified')
        done()
      })
  })

  it('org option maps to team', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        features: []
      })
      .reply(201,
        {shield: false, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, features: [ 'one', 'two' ], state: 'enabled', created_at: now}
      )
    return cmd.run({org: 'my-team', flags: {space: 'my-space'}})
      .then(() => api.done())
  })
})
