'use strict'
/* globals beforeEach */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../../src/commands/labs/info')
const {expect} = require('chai')

describe('labs:info', function () {
  beforeEach(() => cli.mockConsole())

  it('shows user labs feature info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      })
    return cmd.run({args: {feature: 'feature-a'}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`=== feature-a
Description: a user lab feature
Docs:        https://devcenter.heroku.com
Enabled:     true
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows user labs feature info as json', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      })
    return cmd.run({args: {feature: 'feature-a'}, flags: {json: true}})
      .then(() => expect(JSON.parse(cli.stdout), 'to satisfy', {name: 'feature-a'}))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows app labs feature info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/account/features/feature-a').reply(404)
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'an app labs feature',
        doc_url: 'https://devcenter.heroku.com',
      })
    return cmd.run({app: 'myapp', args: {feature: 'feature-a'}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`=== feature-a
Description: an app labs feature
Docs:        https://devcenter.heroku.com
Enabled:     true
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })
})
