'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmd = require('../../../commands/create')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

let now = new Date()
let features = ['one', 'two']

describe('spaces:create', function () {
  beforeEach(() => cli.mockConsole())

  it('is configured for an optional team flag', function () {
    expect(cmd).to.have.own.property('wantsOrg', true)
  })

  it('creates a Standard space', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        features: features,
      })
      .reply(201,
        {shield: false, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, features: ['one', 'two'], state: 'enabled', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'},
      )
    return cmd.run({flags: {team: 'my-team', space: 'my-space', region: 'my-region', features: 'one, two'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Team:       my-team
Region:     my-region
CIDR:       10.0.0.0/16
Data CIDR:  172.23.0.0/20
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
        features: features,
      })
      .reply(201,
        {shield: false, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, features: ['one', 'two'], state: 'enabled', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'},
      )
    return cmd.run({flags: {team: 'my-team', space: 'my-space', region: 'my-region', features: 'one, two'}})
      .then(() => {
        console.log(`\n \n ${cli.stderr} \n \n`)
        expect(cli.stderr).to.include('Spend Alert. During the limited GA period, each Heroku Standard Private')
        expect(cli.stderr).to.include('Space costs $1.67/hour (max $1200/month), pro-rated to the second.')
      })
      .then(() => api.done())
  })

  it('creates a Shield space', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        features: features,
        shield: true,
      })
      .reply(201,
        {shield: true, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, features: ['one', 'two'], state: 'enabled', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'},
      )
    return cmd.run({flags: {team: 'my-team', space: 'my-space', region: 'my-region', features: 'one, two', shield: true}, log_drain_url: 'https://logs.cheetah.com'})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Team:       my-team
Region:     my-region
CIDR:       10.0.0.0/16
Data CIDR:  172.23.0.0/20
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
        shield: true,
      })
      .reply(201,
        {shield: true, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, features: ['one', 'two'], state: 'enabled', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'},
      )
    return cmd.run({flags: {team: 'my-team', space: 'my-space', region: 'my-region', features: 'one, two', shield: true}, log_drain_url: 'https://logs.cheetah.com'})
      .then(() => expect(cli.stderr).to.include('Spend Alert. During the limited GA period, each Heroku Shield Private'))
      .then(() => expect(cli.stderr).to.include('Space costs $5/hour (max $3600/month), pro-rated to the second.'))
      .then(() => api.done())
  })

  it('creates a space with custom cidr and data cidr', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        cidr: '10.0.0.0/16',
        data_cidr: '172.23.0.0/20',
        features: features,
      })
      .reply(201,
        {shield: false, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, features: ['one', 'two'], state: 'enabled', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'},
      )
    return cmd.run({flags: {team: 'my-team', space: 'my-space', region: 'my-region', features: 'one, two', cidr: '10.0.0.0/16', 'data-cidr': '172.23.0.0/20'}, shield: true, log_drain_url: 'https://logs.cheetah.com', cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Team:       my-team
Region:     my-region
CIDR:       10.0.0.0/16
Data CIDR:  172.23.0.0/20
State:      enabled
Shield:     off
Created at: ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('create fails without team name', function (done) {
    cmd.run({flags: {space: 'my-space', region: 'my-region'}})
      .catch(error => {
        expect(error.message).to.equal('No team specified')
        done()
      })
  })
})
