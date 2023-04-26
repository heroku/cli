'use strict'
/* globals beforeEach */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../src/commands/maintenance/on')

describe('maintenance:on', function () {
  beforeEach(() => cli.mockConsole())

  it('turns maintenance mode on', function () {
    let api = nock('https://api.heroku.com:443')
    .patch('/apps/myapp', {maintenance: true})
    .reply(200)
    return cmd.run({app: 'myapp'})
    .then(() => api.done())
  })
})
