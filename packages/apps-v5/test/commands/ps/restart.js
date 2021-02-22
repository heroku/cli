'use strict'
/* globals describe beforeEach it commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find((c) => c.topic === 'ps' && c.command === 'restart')

describe('ps:restart', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('restarts all dynos', async function() {
    let api = nock('https://api.heroku.com')
      .delete('/apps/myapp/dynos').reply(200)

    await cmd.run({ app: 'myapp', args: {} })
    return api.done()
  })
})
