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

const heredoc = tsheredoc.default

describe('data:pg:links:destroy', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('destroys a link on an Advanced database', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const dataApi = nock('https://api.data.heroku.com')
      .delete(`/data/postgres/v1/${addon.id}/links/redis_link`)
      .reply(204)

    const {stderr} = await runCommand(DataPgLinksDestroy, [
      'my-addon',
      'redis_link',
      '--app=myapp',
      '--confirm=myapp',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.equal(heredoc(`
      Destroying link redis_link from ${addon.name}... done
    `))
  })

  it('errors on Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [essentialAddon])

    const {error} = await runCommand(DataPgLinksDestroy, [
      'my-addon',
      'redis_link',
      '--app=myapp',
      '--confirm=myapp',
    ])

    herokuApi.done()
    expect((error as Error).message).to.equal("data:pg:links isn't available for Essential-tier databases.")
  })

  it('redirects to pg:links:destroy on non-Advanced databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])

    const {error} = await runCommand(DataPgLinksDestroy, [
      'my-addon',
      'redis_link',
      '--app=myapp',
      '--confirm=myapp',
    ])

    herokuApi.done()
    expect(ansis.strip((error as Error).message)).to.equal(heredoc(`
      You can only use this command on Advanced-tier databases.
      Run heroku pg:links:destroy ${nonAdvancedAddon.name} redis_link -a myapp instead.
    `).trim())
  })

  it('bails on wrong confirmation', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const {error} = await runCommand(DataPgLinksDestroy, [
      'my-addon',
      'redis_link',
      '--app=myapp',
      '--confirm=another-app',
    ])

    herokuApi.done()
    expect(ansis.strip((error as Error).message)).to.include('Confirmation another-app did not match myapp.')
  })
})
