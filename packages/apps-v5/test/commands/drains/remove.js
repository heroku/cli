'use strict'
/* globals describe it beforeEach */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../src/commands/drains/remove')
const expect = require('chai').expect

describe('drains:remove', function () {
  beforeEach(() => cli.mockConsole())

  it('adds a log drain', async function() {
    let api = nock('https://api.heroku.com:443')
      .delete('/apps/myapp/log-drains/syslog%3A%2F%2Flogs.example.com')
      .reply(200, { url: 'syslog://logs.example.com' })

    await cmd.run({ app: 'myapp', args: { url: 'syslog://logs.example.com' } })

    expect(cli.stdout).to.equal('Successfully removed drain syslog://logs.example.com\n');

    return api.done()
  })
})
