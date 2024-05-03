'use strict'
/* globals beforeEach */

const nock = require('nock')
const cmd = require('../../../commands/topology')
const expect = require('chai').expect
const cli = require('@heroku/heroku-cli-util')

const topo = {
  version: 1,
  apps: [
    {id: '01234567-89ab-cdef-0123-456789abcdef',
      domains: [
        'example.com',
        'example.net',
      ],
      formations: [
        {'id"': '01234567-89ab-cdef-0123-456789abcdef',
          process_type: 'web',
          dynos: [
            {id: '01234567-89ab-cdef-0123-456789abcdef',
              number: 1,
              private_ip: '10.0.134.42',
              hostname: '1.example-app-90210.app.localspace',
            },
            {id: '01234567-89ab-cdef-0123-456789abcdeb',
              number: 2,
              private_ip: '10.0.134.42',
              hostname: '1.example-app-90210.app.localspace',
            },
          ],
        },
      ],
    },
  ],
}

const topo2 = {
  version: 1,
  apps: [
    {id: '01234567-89ab-cdef-0123-456789abcdef',
      domains: [
        'example.com',
        'example.net',
      ],
      formations: [
        {'id"': '01234567-89ab-cdef-0123-456789abcdef',
          process_type: 'web',
          dynos: [
            {id: '01234567-89ab-cdef-0123-456789abcdef',
              number: 2,
              private_ip: '10.0.134.42',
              hostname: '1.example-app-90210.app.localspace',
            },
            {id: '01234567-89ab-cdef-0123-456789abcdeb',
              number: 1,
              private_ip: '10.0.134.42',
              hostname: '1.example-app-90210.app.localspace',
            },
          ],
        },
      ],
    },
  ],
}

const topo3 = {
  version: 1,
  apps: [
    {id: '01234567-89ab-cdef-0123-456789abcdef',
      domains: [
        'example.com',
        'example.net',
      ],
      formations: [
        {'id"': '01234567-89ab-cdef-0123-456789abcdef',
          process_type: 'web',
          dynos: [
            {id: '01234567-89ab-cdef-0123-456789abcdef',
              number: 1,
              private_ip: '10.0.134.42',
              hostname: '1.example-app-90210.app.localspace',
            },
            {id: '01234567-89ab-cdef-0123-456789abcdeb',
              number: 1,
              private_ip: '10.0.134.42',
              hostname: '1.example-app-90210.app.localspace',
            },
          ],
        },
      ],
    },
  ],
}

const app = {
  id: '01234567-89ab-cdef-0123-456789abcdef',
  name: 'app-name',
}

describe('spaces:topology', function () {
  beforeEach(() => cli.mockConsole())

  it('shows space topology', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/topology').reply(200, topo)
      .get(`/apps/${app.id}`).reply(200, app)

    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== app-name (web)
Domains: example.com
         example.net
Dynos:   web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace
         web.2 - 10.0.134.42 - 1.example-app-90210.app.localspace

`))
      .then(() => api.done())
  })

  it('shows space topology with first dyno having higher process number', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/topology').reply(200, topo2)
      .get(`/apps/${app.id}`).reply(200, app)

    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== app-name (web)
Domains: example.com
         example.net
Dynos:   web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace
         web.2 - 10.0.134.42 - 1.example-app-90210.app.localspace

`))
      .then(() => api.done())
  })

  it('shows space topology with dynos having same process number', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/topology').reply(200, topo3)
      .get(`/apps/${app.id}`).reply(200, app)

    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== app-name (web)
Domains: example.com
         example.net
Dynos:   web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace
         web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace

`))
      .then(() => api.done())
  })

  it('shows space topology  --json', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/topology').reply(200, topo)
      .get(`/apps/${app.id}`).reply(200, app)

    return cmd.run({flags: {space: 'my-space', json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(topo))
      .then(() => api.done())
  })

  it('shows space topology --json', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/topology').reply(200, topo)
      .get(`/apps/${app.id}`).reply(200, app)

    return cmd.run({flags: {space: 'my-space', json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(topo))
      .then(() => api.done())
  })
})
