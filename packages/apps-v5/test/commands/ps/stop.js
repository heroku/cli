'use strict'
/* globals commands describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find((c) => c.topic === 'ps' && c.command === 'stop')

describe('ps:stop', function () {
  beforeEach(() => {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('stops all web dynos', async function() {
    let api = nock('https://api.heroku.com')
      .post('/apps/myapp/dynos/web/actions/stop').reply(200)

    await cmd.run({ app: 'myapp', args: { dyno: 'web' } })
    return api.done()
  })

  it('stops run.10 dyno', async function() {
    let api = nock('https://api.heroku.com')
      .post('/apps/myapp/dynos/run.10/actions/stop').reply(200)

    await cmd.run({ app: 'myapp', args: { dyno: 'run.10' } })
    return api.done()
  })
})
