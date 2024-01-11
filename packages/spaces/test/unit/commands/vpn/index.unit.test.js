'use strict'
/* globals beforeEach */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../../commands/vpn/index')
const expect = require('chai').expect

describe('spaces:vpn:connections', function () {
  beforeEach(() => cli.mockConsole())

  let space = {
    id: '123456789012',
    name: 'office',
    public_ip: '35.161.69.30',
    routable_cidrs: [
      '172.16.0.0/16',
    ],
    ike_version: 1,
    space_cidr_block: '10.0.0.0/16',
    status: 'active',
    status_message: 'Active',
    tunnels: [
      {
        last_status_change: '2016-10-25T22:10:05Z',
        ip: '52.44.146.197',
        customer_ip: '52.44.146.197',
        pre_shared_key: 'secret',
        status: 'UP',
        status_message: 'status message',
      },
      {
        last_status_change: '2016-10-25T22:09:05Z',
        ip: '52.44.146.196',
        customer_ip: '52.44.146.196',
        pre_shared_key: 'secret',
        status: 'UP',
        status_message: 'status message',
      },
    ],
  }
  it('displays no connection message if none exist', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections')
      .reply(200, [])
    return cmd.run({flags: {
      space: 'my-space',
    }})
      .then(() => expect(cli.stdout).to.equal('No VPN Connections have been created yet\n'))
      .then(() => api.done())
  })
  it('displays VPN Connections', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections')
      .reply(200, [space])
    return cmd.run({flags: {
      space: 'my-space',
    }})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space VPN Connections
Name    Status  Tunnels
──────  ──────  ───────
office  active  UP/UP
`,
      ))
      .then(() => api.done())
  })
  it('displays VPN Connection ID when name is unavailable', function () {
    let conn = {...space, name: ''}
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections')
      .reply(200, [conn])
    return cmd.run({flags: {
      space: 'my-space',
    }})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space VPN Connections
Name          Status  Tunnels
────────────  ──────  ───────
123456789012  active  UP/UP
`,
      ))
      .then(() => api.done())
  })
  it('displays VPN Connections in json', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections')
      .reply(200, [space])
    return cmd.run({flags: {
      space: 'my-space',
      json: true,
    }})
      .then(() => expect(cli.stdout).to.equal(
        `[
  {
    "id": "123456789012",
    "name": "office",
    "public_ip": "35.161.69.30",
    "routable_cidrs": [
      "172.16.0.0/16"
    ],
    "ike_version": 1,
    "space_cidr_block": "10.0.0.0/16",
    "status": "active",
    "status_message": "Active",
    "tunnels": [
      {
        "last_status_change": "2016-10-25T22:10:05Z",
        "ip": "52.44.146.197",
        "customer_ip": "52.44.146.197",
        "pre_shared_key": "secret",
        "status": "UP",
        "status_message": "status message"
      },
      {
        "last_status_change": "2016-10-25T22:09:05Z",
        "ip": "52.44.146.196",
        "customer_ip": "52.44.146.196",
        "pre_shared_key": "secret",
        "status": "UP",
        "status_message": "status message"
      }
    ]
  }
]
`,
      ))
      .then(() => api.done())
  })
})
