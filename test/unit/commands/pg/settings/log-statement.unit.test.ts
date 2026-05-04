import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/settings/log-statement.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('pg:settings:log-statement', function () {
  const addon = fixtures.addons['dwh-db']
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'test-database',
        app: 'myapp',
      })
      .reply(200, [{addon}])
  })

  afterEach(function () {
    api.done()
    pg.done()
    nock.cleanAll()
  })

  it('shows settings for log_statements', async function () {
    pg = nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(
        200,
        {
          log_statement: {
            value: 'ddl',
            values: {
              ddl: "All data definition statements, such as CREATE, ALTER and DROP, will be logged in your application's logs.",
              none: "No statements will be logged in your application's logs..",
            },
          },
        },
      )

    const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout).to.equal(heredoc(`
      log-statement is set to ddl for ${addon.name}.
      All data definition statements, such as CREATE, ALTER and DROP, will be logged in your application's logs.
    `))
  })
})
