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

const heredoc = tsheredoc.default

describe('data:pg:links', function () {
  const linksResponse = [
    {
      created_at: '2025-01-01T12:00:00Z',
      id: 'link-1',
      name: 'redis_link',
      remote: {
        attachment_name: 'REDIS',
        name: 'redis-001',
      },
      remote_name: 'REDIS',
    },
  ]

  afterEach(function () {
    nock.cleanAll()
  })

  it('lists links for a specified Advanced database', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/links`)
      .reply(200, linksResponse)

    const {stdout} = await runCommand(DataPgLinks, ['my-addon', '--app=myapp'])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stdout)).to.equal(heredoc(`
      === ⛁ advanced-horizontal-01234

       * redis_link
      created_at: 2025-01-01T12:00:00Z
      remote:     REDIS (⛁ redis-001)
    `))
  })

  it('shows an empty message when no links are configured', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/links`)
      .reply(200, [])

    const {stdout} = await runCommand(DataPgLinks, ['my-addon', '--app=myapp'])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stdout)).to.include('No data sources are linked into this database')
  })

  it('errors on Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [essentialAddon])

    const {error} = await runCommand(DataPgLinks, ['my-addon', '--app=myapp'])

    herokuApi.done()
    expect((error as Error).message).to.equal("data:pg:links isn't available for Essential-tier databases.")
  })

  it('errors on legacy Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [legacyEssentialAddon])

    const {error} = await runCommand(DataPgLinks, ['my-addon', '--app=myapp'])

    herokuApi.done()
    expect((error as Error).message).to.equal("data:pg:links isn't available for Essential-tier databases.")
  })

  it('redirects to pg:links on non-Advanced databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])

    const {error} = await runCommand(DataPgLinks, ['my-addon', '--app=myapp'])

    herokuApi.done()
    expect(ansis.strip((error as Error).message)).to.equal(heredoc(`
      You can only use this command on Advanced-tier databases.
      Run heroku pg:links ${nonAdvancedAddon.name} -a myapp instead.
    `).trim())
  })
})
