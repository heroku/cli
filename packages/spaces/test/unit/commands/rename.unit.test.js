'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmd = require('../../../commands/rename')
let cli = require('heroku-cli-util')

describe('spaces:rename', function () {
  beforeEach(() => cli.mockConsole())

  it('renames a space', function () {
    let api = nock('https://api.heroku.com:443')
      .patch('/spaces/old-space-name', {name: 'new-space-name'})
      .reply(200)
    return cmd.run({flags: {from: 'old-space-name', to: 'new-space-name'}})
      .then(() => api.done())
  })
})
