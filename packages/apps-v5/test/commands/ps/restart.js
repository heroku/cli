'use strict'
/* globals beforeEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find(c => c.topic === 'ps' && c.command === 'restart')

describe('ps:restart', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('restarts all dynos', function () {
    let api = nock('https://api.heroku.com')
    .delete('/apps/myapp/dynos').reply(200)

    return cmd.run({app: 'myapp', args: {}})
    .then(() => api.done())
  })
})
