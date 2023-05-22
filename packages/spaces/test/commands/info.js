'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmd = require('../../commands/info')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

let now = new Date()

describe('spaces:info', function () {
  beforeEach(() => cli.mockConsole())

  it('shows space info', function () {
    let api = nock('https://api.heroku.com:443', {reqheaders: {'Accept-Expansion': 'region'}})
      .get('/spaces/my-space')
      .reply(200,
        {shield: false, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region', description: 'region'}, state: 'enabled', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'},
      )
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Team:         my-team
Region:       region
CIDR:         10.0.0.0/16
Data CIDR:    172.23.0.0/20
State:        enabled
Shield:       off
Created at:   ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('shows space info --json', function () {
    let space = {name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, state: 'enabled', created_at: now.toISOString(), cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'}

    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, space)

    return cmd.run({flags: {space: 'my-space', json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(space))
      .then(() => api.done())
  })

  it('shows allocated space with enabled nat', function () {
    let api = nock('https://api.heroku.com:443', {reqheaders: {'Accept-Expansion': 'region'}})
      .get('/spaces/my-space')
      .reply(200,
        {shield: false, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region', description: 'region'}, state: 'allocated', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'},
      )
    let outbound = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/nat')
      .reply(200,
        {state: 'enabled', sources: ['123.456.789.123']},
      )
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Team:         my-team
Region:       region
CIDR:         10.0.0.0/16
Data CIDR:    172.23.0.0/20
State:        allocated
Shield:       off
Outbound IPs: 123.456.789.123
Created at:   ${now.toISOString()}
`))
      .then(() => outbound.done())
      .then(() => api.done())
  })

  it('shows allocated space with disabled nat', function () {
    let api = nock('https://api.heroku.com:443', {reqheaders: {'Accept-Expansion': 'region'}})
      .get('/spaces/my-space')
      .reply(200,
        {shield: false, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region', description: 'region'}, state: 'allocated', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'},
      )
    let outbound = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/nat')
      .reply(200,
        {state: 'disabled', sources: ['123.456.789.123']},
      )
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Team:         my-team
Region:       region
CIDR:         10.0.0.0/16
Data CIDR:    172.23.0.0/20
State:        allocated
Shield:       off
Outbound IPs: disabled
Created at:   ${now.toISOString()}
`))
      .then(() => outbound.done())
      .then(() => api.done())
  })

  it('shows a space with Shield turned off', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200,
        {shield: false, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region', description: 'region'}, state: 'enabled', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'},
      )
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Team:         my-team
Region:       region
CIDR:         10.0.0.0/16
Data CIDR:    172.23.0.0/20
State:        enabled
Shield:       off
Created at:   ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('shows a space with Shield turned on', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200,
        {shield: true, name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region', description: 'region'}, state: 'enabled', created_at: now, cidr: '10.0.0.0/16', data_cidr: '172.23.0.0/20'},
      )
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space
Team:         my-team
Region:       region
CIDR:         10.0.0.0/16
Data CIDR:    172.23.0.0/20
State:        enabled
Shield:       on
Created at:   ${now.toISOString()}
`))
      .then(() => api.done())
  })
})
