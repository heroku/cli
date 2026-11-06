import * as Heroku from '@heroku-cli/schema'
import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/links/index.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc

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

    const {stdout} = await runCommand(Cmd, [
      '--app',
      appName,
    ])
    expectOutput(stdout, heredoc(`
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

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'test-database',
    ])
    expectOutput(stdout, heredoc(`
      === ⛁ ${addon.name}

       * redis-link-1
      created_at: 100
      remote:     REDIS (⛁ redis-001)
    `))
  })

  it('errors when the app has no databases', async function () {
    api
      .get(`/apps/${appName}/addon-attachments`)
      .reply(200, [])

    const {error} = await runCommand(Cmd, ['--app', appName])

    expect(ansis.strip(error?.message ?? '')).to.equal('No databases on ⬢ myapp')
  })

  it('lists every database in attachment order, separated by a blank line', async function () {
    const other = fixtures.addons['dwh-db']
    api
      .get(`/apps/${appName}/addon-attachments`)
      .reply(200, [{addon, name: 'DATABASE'}, {addon: other, name: 'HEROKU_POSTGRESQL_RED'}, {addon, name: 'HEROKU_POSTGRESQL_BLUE'}])
    dataApi
      .get(`/client/v11/databases/${addon.id}/links`)
      .reply(200, [redisLink])
      .get(`/client/v11/databases/${other.id}/links`)
      .reply(200, [])

    const {stdout} = await runCommand(Cmd, ['--app', appName])

    expectOutput(stdout, heredoc(`
      === ⛁ ${addon.name}

       * redis-link-1
      created_at: 100
      remote:     REDIS (⛁ redis-001)

      === ⛁ ${other.name}

      No data sources are linked into this database
    `))
  })
})
