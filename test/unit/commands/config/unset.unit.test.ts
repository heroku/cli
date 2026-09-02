import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import {ConfigUnset} from '../../../../src/commands/config/unset.js'

describe('config', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('removes 2 config vars', async function () {
    api
      .patch('/apps/myapp/config-vars', {
        FOO: null,
        RACK_ENV: null,
      })
      .reply(200, {})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 1}])

    const {stderr} = await runCommand(ConfigUnset, ['-amyapp', 'FOO', 'RACK_ENV'])

    expect(stderr).to.include('done, v1')
  })

  it('ends the action with ! when the config update fails', async function () {
    api
      .patch('/apps/myapp/config-vars', {FOO: null})
      .reply(422, {id: 'invalid_params', message: 'Config unset failed'})

    const {error, stderr} = await runCommand(ConfigUnset, ['-amyapp', 'FOO'])

    expect(error?.message).to.include('Config unset failed')
    expect(stderr).to.include('!')
    expect(stderr).not.to.include('done')
  })

  it('ends the action with ! when the release lookup fails', async function () {
    api
      .patch('/apps/myapp/config-vars', {FOO: null})
      .reply(200, {})
      .get('/apps/myapp/releases')
      .reply(500, {id: 'server_error', message: 'Release lookup failed'})

    const {error, stderr} = await runCommand(ConfigUnset, ['-amyapp', 'FOO'])

    expect(error?.message).to.include('Release lookup failed')
    expect(stderr).to.include('!')
    expect(stderr).not.to.include('done')
  })
})
