import * as Heroku from '@heroku-cli/schema'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/links/index.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

describe('pg:links', function () {
  let api: nock.Scope
  let dataApi: nock.Scope
  let addon: Heroku.AddOn
  const appName = 'myapp'
  const redisLink = {
    created_at: '100',
    name: 'redis-link-1',
    remote: {
      attachment_name: 'REDIS',
      name: 'redis-001',
    },
  }

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    dataApi = nock('https://api.data.heroku.com')
    addon = fixtures.addons['www-db']
  })

  afterEach(function () {
    nock.cleanAll()
    api.done()
    dataApi.done()
  })

  it('shows links', async function () {
    api
      .get(`/apps/${appName}/addon-attachments`)
      .reply(200, [{addon}])
    dataApi
      .get(`/client/v11/databases/${addon.id}/links`)
      .reply(200, [redisLink])

    await runCommand(Cmd, [
      '--app',
      appName,
    ])
    expectOutput(stdout.output, heredoc(`
      === ⛁ ${addon.name}

       * redis-link-1
      created_at: 100
      remote:     REDIS (⛁ redis-001)
    `))
  })

  it('shows links when args are present', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    dataApi
      .get(`/client/v11/databases/${addon.id}/links`)
      .reply(200, [redisLink])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'test-database',
    ])
    expectOutput(stdout.output, heredoc(`
      === ⛁ ${addon.name}

       * redis-link-1
      created_at: 100
      remote:     REDIS (⛁ redis-001)
    `))
  })
})
