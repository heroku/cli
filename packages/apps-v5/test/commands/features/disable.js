'use strict'
/* globals describe commands beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find((c) => c.topic === 'features' && c.command === 'disable')

describe('features:disable', function () {
  beforeEach(() => cli.mockConsole())

  it('disables an app feature', async function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/features/feature-a')
      .reply(200, { enabled: true })
      .patch('/apps/myapp/features/feature-a', { enabled: false })
      .reply(200)
    await cmd.run({ app: 'myapp', args: { feature: 'feature-a' } })
    return api.done()
  })
})
