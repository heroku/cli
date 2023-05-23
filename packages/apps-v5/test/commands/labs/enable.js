'use strict'
/* globals beforeEach */

const cli = require('heroku-cli-util')
const expect = require('chai').expect
const nock = require('nock')
const cmd = require('../../../src/commands/labs/enable')

describe('labs:enable', function () {
  beforeEach(() => cli.mockConsole())

  it('enables a user lab feature', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, {email: 'jeff@heroku.com'})
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: false,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      })
      .patch('/account/features/feature-a', {enabled: true})
      .reply(200)
    return cmd.run({args: {feature: 'feature-a'}})
      .then(() => api.done())
  })

  it('enables an app feature', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/account/features/feature-a').reply(404)
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        enabled: false,
        name: 'feature-a',
        description: 'an app labs feature',
        doc_url: 'https://devcenter.heroku.com',
      })
      .patch('/apps/myapp/features/feature-a', {enabled: true}).reply(200)
    return cmd.run({app: 'myapp', args: {feature: 'feature-a'}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.equal('Enabling feature-a for myapp... done\n'))
      .then(() => api.done())
  })
})
