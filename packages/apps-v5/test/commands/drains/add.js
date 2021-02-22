'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../src/commands/drains/add')
const expect = require('chai').expect

describe('drains:add', function () {
  beforeEach(() => cli.mockConsole())

  it('adds a log drain', async function() {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/log-drains', { url: 'syslog://logs.example.com' })
      .reply(200, { url: 'syslog://logs.example.com' })

    await cmd.run({ app: 'myapp', args: { url: 'syslog://logs.example.com' } })

    expect(cli.stdout).to.equal('Successfully added drain syslog://logs.example.com\n');

    return api.done()
  })
})
