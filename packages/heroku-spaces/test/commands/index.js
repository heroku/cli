'use strict'
/* globals describe beforeEach it */

let nock = require('nock')
let cmd = require('../../commands')

let chai = require('chai')
let expect = chai.expect

let chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

let cli = require('heroku-cli-util')

let now = new Date()

describe('spaces', function () {
  beforeEach(() => cli.mockConsole())

  it('shows spaces', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, [
        {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region'}, state: 'enabled', created_at: now}
      ])
    return cmd.run({flags: {}})
      .then(() => expect(cli.stdout).to.equal(
        `Name      Organization  Region     State    Created At
────────  ────────────  ─────────  ───────  ────────────────────────
my-space  my-org        my-region  enabled  ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('shows spaces with --json', function () {
    let spaces = [{name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region'}, state: 'enabled', created_at: now.toISOString()}]
    let api = nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, spaces)
    return cmd.run({flags: {json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(spaces))
      .then(() => api.done())
  })

  it('shows spaces scoped by orgs', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, [
        {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region'}, state: 'enabled', created_at: now},
        {name: 'other-space', organization: {name: 'other-org'}, region: {name: 'my-region'}, state: 'enabled', created_at: now}
      ])
    return cmd.run({flags: {}, org: 'my-org'})
      .then(() => expect(cli.stdout).to.equal(
        `Name      Organization  Region     State    Created At
────────  ────────────  ─────────  ───────  ────────────────────────
my-space  my-org        my-region  enabled  ${now.toISOString()}
`))
      .then(() => api.done())
  })

  it('shows spaces org error message', function () {
    nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, [])
    return chai.assert.isRejected(cmd.run({flags: {}, org: 'my-org'}), /^Error: No spaces in my-org.$/)
  })

  it('shows spaces error message', function () {
    nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, [])
    return chai.assert.isRejected(cmd.run({flags: {}}), /^Error: You do not have access to any spaces./)
  })
})
