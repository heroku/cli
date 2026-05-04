import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-analyze.js'
import * as fixtures from '../../../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('pg:settings:auto-explain:log-analyze', function () {
  const addon = fixtures.addons['dwh-db']
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'test-database',
        app: 'myapp',
      }).reply(200, [{addon}])
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('updates settings for auto_explain.log_analyze with value', async function () {
    const pg = nock('https://api.data.heroku.com')
      .patch(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_analyze': {value: true}})

    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database', 'true'])

    api.done()
    pg.done()

    expect(stdout).to.equal(heredoc(`
      auto-explain.log-analyze has been set to true for ${addon.name}.
      EXPLAIN ANALYZE execution plans will be logged.
    `))
  })

  it('shows settings for auto_explain.log_analyze with no value', async function () {
    const pg = nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_analyze': {value: false}})

    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])

    api.done()
    pg.done()

    expect(stdout).to.equal(heredoc(`
      auto-explain.log-analyze is set to false for ${addon.name}.
      EXPLAIN ANALYZE execution plans will not be logged.
    `))
  })
})
