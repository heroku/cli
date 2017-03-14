'use strict'

const nock = require('nock')
const td = require('testdouble')
const proxyquire = require('proxyquire')

const netrc = td.constructor(require('netrc-parser'))
netrc['@global'] = true
const cli = proxyquire('heroku-cli-util', {'netrc-parser': netrc})

// get command from index.js
const cmd = proxyquire('../../../commands/auth/whoami', {'heroku-cli-util': cli})[0]
const expect = require('unexpected')

describe('auth:whoami', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows logged in user', () => {
    let api = nock('https://api.heroku.com')
    .get('/account')
    .reply(200, {email: 'foo@bar.com'})

    netrc.prototype.machines = {'api.heroku.com': {password: 'myapikye'}}
    return cmd.run({})
      .then(() => expect(cli.stdout, 'to equal', 'foo@bar.com\n'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })
})
