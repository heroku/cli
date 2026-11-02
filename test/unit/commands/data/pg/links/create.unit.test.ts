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
} from '../../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc

const remoteAddon = {
  ...addon,
  id: 'd4bf27a1-c8ca-4b3f-9df7-7a3d02b8f3c9',
  name: 'advanced-vertical-56789',
}

describe('data:pg:links:create', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('creates a link on an Advanced database', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'heroku-postgres', app: 'myapp'})
      .reply(200, [{addon}])
      .post('/actions/addons/resolve', {addon: 'heroku-postgres-remote', app: 'myapp'})
      .reply(200, [remoteAddon])
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/data/postgres/v1/${addon.id}/links`, {as: 'pg_link', target: remoteAddon.name})
      .reply(200, {name: 'pg_link'})

    const {stderr} = await runCommand(DataPgLinksCreate, [
      'heroku-postgres',
      'heroku-postgres-remote',
      '--app=myapp',
      '--as=pg_link',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.equal(heredoc(`
      Adding link from ⛁ ${remoteAddon.name} to ⛁ ${addon.name}... done, pg_link
    `))
  })

  it('errors on Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'heroku-postgres', app: 'myapp'})
      .reply(200, [{addon: essentialAddon}])
      .post('/actions/addons/resolve', {addon: 'heroku-postgres-remote', app: 'myapp'})
      .reply(200, [remoteAddon])

    const {error} = await runCommand(DataPgLinksCreate, [
      'heroku-postgres',
      'heroku-postgres-remote',
      '--app=myapp',
      '--as=pg_link',
    ])

    herokuApi.done()
    expect((error as Error).message).to.equal('You can only use this command to create Data Links on Advanced-tier databases.')
  })

  it('lists only Advanced-tier databases when the database arg is unknown', async function () {
    const advancedAttachment = {
      addon: {id: addon.id, name: addon.name, plan: {id: addon.plan.id, name: addon.plan.name}},
      app: {id: addon.app.id, name: addon.app.name},
      config_vars: ['HEROKU_POSTGRESQL_ADVANCED_URL'],
      id: 'c61eb5ce-0ce2-447e-817e-ba34afe8b95f',
      name: 'HEROKU_POSTGRESQL_ADVANCED',
      namespace: null,
    }
    const standardAttachment = {
      addon: {id: nonAdvancedAddon.id, name: nonAdvancedAddon.name, plan: {id: nonAdvancedAddon.plan.id, name: nonAdvancedAddon.plan.name}},
      app: {id: nonAdvancedAddon.app.id, name: nonAdvancedAddon.app.name},
      config_vars: ['HEROKU_POSTGRESQL_STANDARD_URL'],
      id: '9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4',
      name: 'HEROKU_POSTGRESQL_STANDARD',
      namespace: null,
    }
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'nonexistent', app: 'myapp'})
      .reply(404, {id: 'not_found', message: 'Add-on attachment not found'})
      .get('/apps/myapp/addon-attachments')
      .reply(200, [advancedAttachment, standardAttachment])
      .get('/apps/myapp/config-vars')
      .optionally()
      .reply(200, {})
      .get('/apps/myapp/addon-attachments')
      .reply(200, [advancedAttachment, standardAttachment])
      .post('/actions/addons/resolve', {addon: 'heroku-postgres-remote', app: 'myapp'})
      .reply(200, [remoteAddon])

    const {error} = await runCommand(DataPgLinksCreate, [
      'nonexistent',
      'heroku-postgres-remote',
      '--app=myapp',
      '--as=pg_link',
    ])

    herokuApi.done()
    expect((error as Error).message).to.equal('Unknown Advanced-tier database: nonexistent. Valid options are: HEROKU_POSTGRESQL_ADVANCED')
  })

  it('redirects to pg:links:create when both databases are legacy', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'heroku-postgres', app: 'myapp'})
      .reply(200, [{addon: nonAdvancedAddon}])
      .post('/actions/addons/resolve', {addon: 'heroku-postgres-remote', app: 'myapp'})
      .reply(200, [nonAdvancedAddon])

    const {error} = await runCommand(DataPgLinksCreate, [
      'heroku-postgres',
      'heroku-postgres-remote',
      '--app=myapp',
      '--as=pg_link',
    ])

    herokuApi.done()
    expect(ansis.strip((error as Error).message)).to.equal(heredoc(`
      You can only use this command to create Data Links on Advanced-tier databases.
      Use heroku pg:links:create heroku-postgres-remote ${nonAdvancedAddon.name} -a myapp instead.
    `).trim())
  })

  it('errors when the remote is a legacy Postgres database', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'heroku-postgres', app: 'myapp'})
      .reply(200, [{addon}])
      .post('/actions/addons/resolve', {addon: 'heroku-postgres-remote', app: 'myapp'})
      .reply(200, [nonAdvancedAddon])

    const {error} = await runCommand(DataPgLinksCreate, [
      'heroku-postgres',
      'heroku-postgres-remote',
      '--app=myapp',
      '--as=pg_link',
    ])

    herokuApi.done()
    expect((error as Error).message).to.equal('You can only use this command to create Data Links on Advanced-tier databases.')
  })

  it('does not redirect when the local database is legacy but the remote is Advanced', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'heroku-postgres', app: 'myapp'})
      .reply(200, [{addon: nonAdvancedAddon}])
      .post('/actions/addons/resolve', {addon: 'heroku-postgres-remote', app: 'myapp'})
      .reply(200, [remoteAddon])

    const {error} = await runCommand(DataPgLinksCreate, [
      'heroku-postgres',
      'heroku-postgres-remote',
      '--app=myapp',
      '--as=pg_link',
    ])

    herokuApi.done()
    expect((error as Error).message).to.equal('You can only use this command to create Data Links on Advanced-tier databases.')
  })
})
