'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../src/commands/domains')
const expect = require('chai').expect

describe('domains', function () {
  beforeEach(() => cli.mockConsole())

  it('shows the domains', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains')
      .reply(200, [
        {'cname': 'myapp.com.herokudns.com', 'hostname': 'myapp.com', 'kind': 'custom'},
        {'cname': 'myapp.co.uk.herokudns.com', 'hostname': 'myapp.co.uk', 'kind': 'custom'},
        {'cname': 'www.myapp.com.herokudns.com', 'hostname': 'www.myapp.com', 'kind': 'custom'},
        {'cname': null, 'hostname': 'myapp.herokuapp.com', 'kind': 'heroku'}
      ])
    return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(cli.stdout).to.equal(`=== myapp Heroku Domain
myapp.herokuapp.com

=== myapp Custom Domains
Domain Name    DNS Record Type  DNS Target
─────────────  ───────────────  ───────────────────────────
myapp.com      ALIAS or ANAME   myapp.com.herokudns.com
myapp.co.uk    ALIAS or ANAME   myapp.co.uk.herokudns.com
www.myapp.com  CNAME            www.myapp.com.herokudns.com
`))
      .then(() => api.done())
  })
})
