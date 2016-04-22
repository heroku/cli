'use strict'
/* globals describe beforeEach afterEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/labs/disable')
const expect = require('unexpected')

describe('labs:disable', function () {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('disables a user lab feature', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, {email: 'jeff@heroku.com'})
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com'
      })
      .patch('/account/features/feature-a', {enabled: false})
      .reply(200)
    return cmd.run({args: {feature: 'feature-a'}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr, 'to equal', 'Disabling feature-a for jeff@heroku.com... done\n'))
      .then(() => api.done())
  })

  it('disables an app feature', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/account/features/feature-a').reply(404)
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com'
      })
      .patch('/apps/myapp/features/feature-a', {enabled: false}).reply(200)
    return cmd.run({app: 'myapp', args: {feature: 'feature-a'}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr, 'to equal', 'Disabling feature-a for myapp... done\n'))
      .then(() => api.done())
  })
})
