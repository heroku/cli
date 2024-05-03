'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmd = require('../../../../commands/hosts/index')
let expect = require('chai').expect
let cli = require('@heroku/heroku-cli-util')
let hosts = [
  {
    host_id: 'h-0f927460a59aac18e',
    state: 'available',
    available_capacity_percentage: 72,
    allocated_at: '2020-05-28T04:15:59Z',
    released_at: null,
  },
  {
    host_id: 'h-0e927460a59aac18f',
    state: 'released',
    available_capacity_percentage: 0,
    allocated_at: '2020-03-28T04:15:59Z',
    released_at: '2020-04-28T04:15:59Z',
  },
]

describe('spaces:hosts', function () {
  beforeEach(() => cli.mockConsole())

  it('lists space hosts', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/hosts')
      .reply(200,
        hosts,
      )
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space Hosts
Host ID              State      Available Capacity  Allocated At          Released At
───────────────────  ─────────  ──────────────────  ────────────────────  ────────────────────
h-0f927460a59aac18e  available  72%                 2020-05-28T04:15:59Z
h-0e927460a59aac18f  released   0%                  2020-03-28T04:15:59Z  2020-04-28T04:15:59Z
`))
      .then(() => api.done())
  })

  it('shows hosts:info --json', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/hosts')
      .reply(200, hosts)

    return cmd.run({flags: {space: 'my-space', json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(hosts))
      .then(() => api.done())
  })
})
