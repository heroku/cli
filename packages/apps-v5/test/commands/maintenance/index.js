'use strict'
/* globals commands beforeEach afterEach */

const cli = require('heroku-cli-util')
const nock = require('nock')

// get command from index.js
const cmd = commands.find(c => c.topic === 'maintenance' && !c.command)
const {expect} = require('chai')

describe('maintenance', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => cli.mockConsole())

  // remove all mocked endpoints
  // useful if the test fails since it could screw up other tests
  afterEach(() => nock.cleanAll())

  it('shows that maintenance is on', () => {
    // mock out API
    let api = nock('https://api.heroku.com:443')
    .get('/apps/myapp')
    .reply(200, {maintenance: true})

    // run the command
    return cmd.run({app: 'myapp'})
    // check stdout
    .then(() => expect(cli.stdout).to.equal('on\n'))
    // check stderr
    .then(() => expect(cli.stderr, 'to be empty'))
    // ensure all nock HTTP expectations are met
    .then(() => api.done())
  })

  it('shows that maintenance is off', () => {
    let api = nock('https://api.heroku.com:443')
    .get('/apps/myapp')
    .reply(200, {maintenance: false})
    return cmd.run({app: 'myapp'})
    .then(() => expect(cli.stdout).to.equal('off\n'))
    .then(() => expect(cli.stderr, 'to be empty'))
    .then(() => api.done())
  })
})
