'use strict'
/* globals commands beforeEach */

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const cmd = commands.find(c => c.topic === 'features' && c.command === 'enable')

describe('features:enable', function () {
  beforeEach(() => cli.mockConsole())

  it('enables an app feature', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/features/feature-a')
      .reply(200, {enabled: false})
      .patch('/apps/myapp/features/feature-a', {enabled: true})
      .reply(200)
    return cmd.run({app: 'myapp', args: {feature: 'feature-a'}})
      .then(() => api.done())
  })
})
