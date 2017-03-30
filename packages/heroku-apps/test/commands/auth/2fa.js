'use strict'
/* globals commands describe beforeEach afterEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')

// get command from index.js
const cmd = commands.find(c => c.topic === 'auth' && c.command === '2fa')
const expect = require('unexpected')

describe('auth:2fa', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows 2fa is enabled', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, {two_factor_authentication: true})

    return cmd.run({})
      .then(() => expect(cli.stdout, 'to equal', 'Two-factor authentication is enabled\n'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows 2fa is disabled', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, {two_factor_authentication: false})

    return cmd.run({})
      .then(() => expect(cli.stdout, 'to equal', 'Two-factor authentication is not enabled\n'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('is aliased by 2fa', () => {
    const cmd = commands.find(c => c.topic === '2fa' && !c.command)
    expect(cmd, 'to have own properties', {
      topic: '2fa'
    })
    expect(cmd, 'not to have own properties', ['command'])
  })
})
