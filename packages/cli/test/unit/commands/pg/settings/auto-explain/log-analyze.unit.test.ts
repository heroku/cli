import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../../helpers/runCommand'
import Cmd from '../../../../../../src/commands/pg/settings/auto-explain/log-analyze'
import * as fixtures from '../../../../../fixtures/addons/fixtures'

describe('pg:settings:auto-explain:log-analyze', () => {
  const addon = fixtures.addons['dwh-db']
  let api: nock.Scope

  beforeEach(() => {
    api = nock('https://api.heroku.com')
      .post('/actions/addons/resolve', {
        app: 'myapp',
        addon: 'test-database',
      }).reply(200, [addon])
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('updates settings for auto_explain.log_analyze with value', async () => {
    const pg = nock('https://api.data.heroku.com')
      .patch(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_analyze': {value: true}})

    await runCommand(Cmd, ['--app', 'myapp', 'test-database', 'true'])

    api.done()
    pg.done()

    expect(stdout.output).to.equal(heredoc(`
      auto-explain.log-analyze has been set to true for ${addon.name}.
      EXPLAIN ANALYZE execution plans will be logged.
    `))
  })

  it('shows settings for auto_explain.log_analyze with no value', async () => {
    const pg = nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.id}/config`).reply(200, {'auto_explain.log_analyze': {value: false}})

    await runCommand(Cmd, ['--app', 'myapp', 'test-database'])

    api.done()
    pg.done()

    expect(stdout.output).to.equal(heredoc(`
      auto-explain.log-analyze is set to false for ${addon.name}.
      EXPLAIN ANALYZE execution plans will not be logged.
    `))
  })
})
