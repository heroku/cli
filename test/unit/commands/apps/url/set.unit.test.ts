import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {restore} from 'sinon'

import UrlSetCommand from '../../../../../src/commands/apps/url/set.js'

describe('apps:url:set', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
    restore()
  })

  it('sets the web_url_override', async function () {
    api
      .patch('/apps/myapp', {web_url_override: 'https://www.example.com/'})
      .reply(200, {name: 'myapp', web_url: 'https://www.example.com/'})

    await runCommand(UrlSetCommand, ['https://www.example.com/', '-a', 'myapp'])
  })

  it('clears the override with --reset', async function () {
    api
      .patch('/apps/myapp', {web_url_override: null})
      .reply(200, {name: 'myapp', web_url: 'https://myapp.herokuapp.com/'})

    await runCommand(UrlSetCommand, ['--reset', '-a', 'myapp'])
  })
})
