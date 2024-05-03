'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmd = require('../../../commands/destroy')
let cli = require('@heroku/heroku-cli-util')

let now = new Date()

describe('spaces:destroy', function () {
  beforeEach(() => cli.mockConsole())

  it('destroys a space', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, {name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, state: 'allocated', created_at: now})
      .get('/spaces/my-space/nat')
      .reply(200, {state: 'enabled', sources: ['1.1.1.1', '2.2.2.2']})
      .delete('/spaces/my-space')
      .reply(200)
    return cmd.run({flags: {space: 'my-space', confirm: 'my-space'}})
      .then(() => api.done())
  })
})
