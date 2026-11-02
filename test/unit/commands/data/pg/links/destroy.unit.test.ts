import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import DataPgLinksDestroy from '../../../../../../src/commands/data/pg/links/destroy.js'
import {
  addon,
  essentialAddon,
  nonAdvancedAddon,
} from '../../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc

describe('data:pg:links:destroy', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('destroys a link on an Advanced database', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'my-addon', app: 'myapp'})
      .reply(200, [{addon}])
    const dataApi = nock('https://api.data.heroku.com')
      .delete(`/data/postgres/v1/${addon.id}/links/pg_link`)
      .reply(204)

    const {stderr} = await runCommand(DataPgLinksDestroy, [
      'my-addon',
      'pg_link',
      '--app=myapp',
      '--confirm=myapp',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.equal(heredoc(`
      Destroying link pg_link from ${addon.name}... done
    `))
  })

  it('errors on Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'my-addon', app: 'myapp'})
      .reply(200, [{addon: essentialAddon}])

    const {error} = await runCommand(DataPgLinksDestroy, [
      'my-addon',
      'pg_link',
      '--app=myapp',
      '--confirm=myapp',
    ])

    herokuApi.done()
    expect((error as Error).message).to.equal("You can only use this command to destroy Data Links on Advanced-tier databases.")
  })

  it('redirects to pg:links:destroy on non-Advanced databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'my-addon', app: 'myapp'})
      .reply(200, [{addon: nonAdvancedAddon}])

    const {error} = await runCommand(DataPgLinksDestroy, [
      'my-addon',
      'pg_link',
      '--app=myapp',
      '--confirm=myapp',
    ])

    herokuApi.done()
    expect(ansis.strip((error as Error).message)).to.equal(heredoc(`
      You can only use this command to destroy Data Links on Advanced-tier databases.
      Use heroku pg:links:destroy ${nonAdvancedAddon.name} pg_link -a myapp instead.
    `).trim())
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

    const {error} = await runCommand(DataPgLinksDestroy, [
      'nonexistent',
      'pg_link',
      '--app=myapp',
      '--confirm=myapp',
    ])

    herokuApi.done()
    expect((error as Error).message).to.equal('Unknown Advanced-tier database: nonexistent. Valid options are: HEROKU_POSTGRESQL_ADVANCED')
  })

  it('bails on wrong confirmation', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'my-addon', app: 'myapp'})
      .reply(200, [{addon}])

    const {error} = await runCommand(DataPgLinksDestroy, [
      'my-addon',
      'pg_link',
      '--app=myapp',
      '--confirm=another-app',
    ])

    herokuApi.done()
    expect(ansis.strip((error as Error).message)).to.include('Confirmation another-app did not match myapp.')
  })
})
