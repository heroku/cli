'use strict'
/* globals commands describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find((c) => c.topic === 'features' && c.command === 'enable')

describe('features:enable', function () {
  beforeEach(() => cli.mockConsole())

  it('enables an app feature', async function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/features/feature-a')
      .reply(200, { enabled: false })
      .patch('/apps/myapp/features/feature-a', { enabled: true })
      .reply(200)
    await cmd.run({ app: 'myapp', args: { feature: 'feature-a' } })
    return api.done()
  })
})
