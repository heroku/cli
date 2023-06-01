'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmd = require('../../../commands')

let chai = require('chai')
let expect = chai.expect

let chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

let cli = require('heroku-cli-util')

let now = new Date()

describe('spaces', function () {
  beforeEach(() => cli.mockConsole())

  it('is configured for an optional team flag', function () {
    expect(cmd).to.have.own.property('wantsOrg', true)
  })

  it('shows spaces', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, [
        {name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, state: 'enabled', created_at: now},
      ])
    return cmd.run({flags: {}})
      .then(() => expect(cli.stdout).to.equal(
        `Name      Team     Region     State    Created At
────────  ───────  ─────────  ───────  ────────────────────────
my-space  my-team  my-region  enabled  ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('shows spaces with --json', function () {
    let spaces = [{name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, state: 'enabled', created_at: now.toISOString()}]
    let api = nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, spaces)
    return cmd.run({flags: {json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(spaces))
      .then(() => api.done())
  })

  it('shows spaces scoped by teams', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, [
        {name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, state: 'enabled', created_at: now},
        {name: 'other-space', team: {name: 'other-team'}, region: {name: 'my-region'}, state: 'enabled', created_at: now},
      ])
    return cmd.run({flags: {team: 'my-team'}})
      .then(() => expect(cli.stdout).to.equal(
        `Name      Team     Region     State    Created At
────────  ───────  ─────────  ───────  ────────────────────────
my-space  my-team  my-region  enabled  ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('maps org option to team and shows spaces scoped by teams', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, [
        {name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, state: 'enabled', created_at: now},
        {name: 'other-space', team: {name: 'other-team'}, region: {name: 'my-region'}, state: 'enabled', created_at: now},
      ])
    return cmd.run({flags: {team: 'my-team'}})
      .then(() => expect(cli.stdout).to.equal(
        `Name      Team     Region     State    Created At
────────  ───────  ─────────  ───────  ────────────────────────
my-space  my-team  my-region  enabled  ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('shows spaces team error message', function () {
    nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, [])
    return chai.assert.isRejected(cmd.run({flags: {team: 'my-team'}}), /^No spaces in my-team.$/)
  })

  it('shows spaces error message', function () {
    nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, [])
    return chai.assert.isRejected(cmd.run({flags: {}}), /^You do not have access to any spaces./)
  })
})
