'use strict'
/* globals beforeEach */

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../../src/commands/labs')
const expect = require('chai').expect

describe('labs', function () {
  beforeEach(() => cli.mockConsole())

  it('shows labs features', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, {email: 'jeff@heroku.com'})
      .get('/account/features')
      .reply(200, [
        {enabled: true, name: 'lab feature a', description: 'a user lab feature'},
        {enabled: false, name: 'lab feature b', description: 'a user lab feature'},
      ])
      .get('/apps/myapp/features')
      .reply(200, [
        {enabled: true, name: 'lab feature c', description: 'an app lab feature'},
      ])
    return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(cli.stdout).to.equal(`=== User Features jeff@heroku.com
[+] lab feature a  a user lab feature
[ ] lab feature b  a user lab feature

=== App Features myapp
[+] lab feature c  an app lab feature
`))
      .then(() => api.done())
  })
})
