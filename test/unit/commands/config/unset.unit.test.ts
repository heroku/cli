import {runCommand} from '@heroku-cli/test-utils'
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

    await runCommand(ConfigUnset, ['-amyapp', 'FOO', 'RACK_ENV'])
  })
})
