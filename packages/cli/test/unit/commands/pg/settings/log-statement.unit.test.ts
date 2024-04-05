import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand'
import Cmd from '../../../../../src/commands/pg/settings/log-statement'
import * as fixtures from '../../../../fixtures/addons/fixtures'

describe.only('pg:settings:log-statement', () => {
  const addon = fixtures.addons['dwh-db']

  beforeEach(() => {
    nock('https://api.heroku.com')
      .post('/actions/addons/resolve', {
        app: 'myapp',
        addon: 'test-database',
      }).reply(200, [addon])
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('shows settings for log_statements', async () => {
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200,
        {
          log_statement: {
            value: 'ddl',
            values: {
              none: "No statements will be logged in your application's logs..",
              ddl: "All data definition statements, such as CREATE, ALTER and DROP, will be logged in your application's logs.",
            },
          },
        },
      )

    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])
    expect(stdout.output).to.equal(heredoc(`
      log-statement is set to ddl for ${addon.name}.
      All data definition statements, such as CREATE, ALTER and DROP, will be logged in your application's logs.
    `))
  })
})
