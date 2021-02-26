'use strict'
/* globals commands, describe beforeEach afterEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')

// get command from index.js
const cmd = commands.find((c) => c.topic === 'maintenance' && !c.command)
const { expect } = require('chai')

describe('maintenance', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => cli.mockConsole())

  // remove all mocked endpoints
  // useful if the test fails since it could screw up other tests
  afterEach(() => nock.cleanAll())

  it('shows that maintenance is on', async () => {
    // mock out API
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, { maintenance: true })

    // run the command
    await // check stdout
    cmd.run({ app: 'myapp' })

    expect(cli.stdout).to.equal('on\n');
    expect(cli.stderr, 'to be empty');

    return api.done()
  })

  it('shows that maintenance is off', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, { maintenance: false })

    await cmd.run({ app: 'myapp' })

    expect(cli.stdout).to.equal('off\n');
    expect(cli.stderr, 'to be empty');

    return api.done()
  })
})
