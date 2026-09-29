import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import DataPgLinksCreate from '../../../../../../src/commands/data/pg/links/create.js'
import {
  addon,
  essentialAddon,
  nonAdvancedAddon,
  nonPostgresAddon,
} from '../../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc.default

describe('data:pg:links:create', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('creates a link on an Advanced database', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve', {addon: 'heroku-postgres', app: 'myapp'})
      .reply(200, [addon])
      .post('/actions/addons/resolve', {addon: 'heroku-redis', app: 'myapp'})
      .reply(200, [nonPostgresAddon])
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/data/postgres/v1/${addon.id}/links`, {as: 'redis_link', target: nonPostgresAddon.name})
      .reply(200, {name: 'redis_link'})

    const {stderr} = await runCommand(DataPgLinksCreate, [
      'heroku-redis',
      'heroku-postgres',
      '--app=myapp',
      '--as=redis_link',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.equal(heredoc(`
      Adding link from ⛁ ${nonPostgresAddon.name} to ⛁ ${addon.name}... done, redis_link
    `))
  })

  it('errors when the link name is invalid', async function () {
    const {error} = await runCommand(DataPgLinksCreate, [
      'heroku-redis',
      'heroku-postgres',
      '--app=myapp',
      '--as=Bad-Name',
    ])

    expect((error as Error).message).to.equal(
      "Link name must be 63 alphanumeric characters or less, start with a lowercase letter, and not begin with 'pg_'.",
    )
  })

  it('errors when the link name starts with pg_', async function () {
    const {error} = await runCommand(DataPgLinksCreate, [
      'heroku-redis',
      'heroku-postgres',
      '--app=myapp',
      '--as=pg_reserved',
    ])

    expect((error as Error).message).to.equal(
      "Link name must be 63 alphanumeric characters or less, start with a lowercase letter, and not begin with 'pg_'.",
    )
  })

  it('errors on Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve', {addon: 'heroku-postgres', app: 'myapp'})
      .reply(200, [essentialAddon])
      .post('/actions/addons/resolve', {addon: 'heroku-redis', app: 'myapp'})
      .reply(200, [nonPostgresAddon])

    const {error} = await runCommand(DataPgLinksCreate, [
      'heroku-redis',
      'heroku-postgres',
      '--app=myapp',
      '--as=redis_link',
    ])

    herokuApi.done()
    expect((error as Error).message).to.equal("data:pg:links isn't available for Essential-tier databases.")
  })

  it('redirects to pg:links:create on non-Advanced databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve', {addon: 'heroku-postgres', app: 'myapp'})
      .reply(200, [nonAdvancedAddon])
      .post('/actions/addons/resolve', {addon: 'heroku-redis', app: 'myapp'})
      .reply(200, [nonPostgresAddon])

    const {error} = await runCommand(DataPgLinksCreate, [
      'heroku-redis',
      'heroku-postgres',
      '--app=myapp',
      '--as=redis_link',
    ])

    herokuApi.done()
    expect(ansis.strip((error as Error).message)).to.equal(heredoc(`
      You can only use this command on Advanced-tier databases.
      Run heroku pg:links:create heroku-redis ${nonAdvancedAddon.name} -a myapp instead.
    `).trim())
  })
})
