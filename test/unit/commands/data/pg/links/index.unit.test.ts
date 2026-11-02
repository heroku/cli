import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import DataPgLinks from '../../../../../../src/commands/data/pg/links/index.js'
import {
  addon,
  essentialAddon,
  legacyEssentialAddon,
  nonAdvancedAddon,
} from '../../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc

describe('data:pg:links', function () {
  const linksResponse = {
    items: [
      {
        created_at: '2025-01-01T12:00:00Z',
        id: 'link-1',
        name: 'pg_link',
        remote: {
          attachment_name: 'POSTGRES',
          name: 'postgres-001',
        },
        remote_name: 'POSTGRES',
      },
    ],
  }

  afterEach(function () {
    nock.cleanAll()
  })

  it('lists links for a specified Advanced database', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'my-addon', app: 'myapp'})
      .reply(200, [{addon}])
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/links`)
      .reply(200, linksResponse)

    const {stdout} = await runCommand(DataPgLinks, ['my-addon', '--app=myapp'])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stdout)).to.equal(heredoc(`
      === ⛁ advanced-horizontal-01234

       * pg_link
      created_at: 2025-01-01T12:00:00Z
      remote:     POSTGRES (⛁ postgres-001)
    `))
  })

  it('shows an empty message when no links are configured', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'my-addon', app: 'myapp'})
      .reply(200, [{addon}])
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/links`)
      .reply(200, {items: []})

    const {stdout} = await runCommand(DataPgLinks, ['my-addon', '--app=myapp'])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stdout)).to.include("This database isn't linked to another data source.")
  })

  it('errors on Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'my-addon', app: 'myapp'})
      .reply(200, [{addon: essentialAddon}])

    const {error} = await runCommand(DataPgLinks, ['my-addon', '--app=myapp'])

    herokuApi.done()
    expect((error as Error).message).to.equal("You can only use this command to view Data Links on Advanced-tier databases.")
  })

  it('errors on legacy Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'my-addon', app: 'myapp'})
      .reply(200, [{addon: legacyEssentialAddon}])

    const {error} = await runCommand(DataPgLinks, ['my-addon', '--app=myapp'])

    herokuApi.done()
    expect((error as Error).message).to.equal("You can only use this command to view Data Links on Advanced-tier databases.")
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

    const {error} = await runCommand(DataPgLinks, ['nonexistent', '--app=myapp'])

    herokuApi.done()
    expect((error as Error).message).to.equal('Unknown Advanced-tier database: nonexistent. Valid options are: HEROKU_POSTGRESQL_ADVANCED')
  })

  it('redirects to pg:links on non-Advanced databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'my-addon', app: 'myapp'})
      .reply(200, [{addon: nonAdvancedAddon}])

    const {error} = await runCommand(DataPgLinks, ['my-addon', '--app=myapp'])

    herokuApi.done()
    expect(ansis.strip((error as Error).message)).to.equal(heredoc(`
      You can only use this command to view Data Links on Advanced-tier databases.
      Use heroku pg:links ${nonAdvancedAddon.name} -a myapp instead.
    `).trim())
  })
})
