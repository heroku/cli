import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import DataPgDestroy from '../../../../../src/commands/data/pg/destroy.js'
import {addon, destroyedAddonResponse, nonPostgresAddon} from '../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc.default

describe('data:pg:destroy', function () {
  it('destroys a advanced addon', async function () {
    const resolveApi = nock('https://api.heroku.com').post('/actions/addons/resolve').reply(200, [addon])
    const destroyApi = nock('https://api.heroku.com')
      .delete(`/apps/${addon.app?.id}/addons/${addon.id}`)
      .reply(200, destroyedAddonResponse)

    const {stderr, stdout} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])

    resolveApi.done()
    destroyApi.done()

    expect(ansis.strip(stderr)).to.equal(heredoc(`
        Destroying advanced-horizontal-01234 on ⬢ myapp... done
      `))
    expect(stdout).to.equal('We successfully destroyed your database.\n')
  })

  it('bails if incorrect confirmation', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const {error} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=another-app'])
    resolveApi.done()
    expect(ansis.strip((error as Error).message)).to.equal(`Confirmation another-app did not match myapp. Your database ${addon.name} still exists.`)
  })

  it('doesn\'t destroy non-Postgres addons', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonPostgresAddon])

    const {error} = await runCommand(DataPgDestroy, [nonPostgresAddon.name!, '--app=myapp', '--confirm=myapp'])
    resolveApi.done()
    expect(ansis.strip((error as Error).message)).to.equal('Couldn\'t find that addon.')
  })

  it('prevents destruction of addons attached to a different app', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const {error} = await runCommand(DataPgDestroy, [addon.name!, '--app=another-app'])
    resolveApi.done()
    expect(ansis.strip((error as Error).message)).to.equal('Database advanced-horizontal-01234 is on myapp not another-app. Try again with the correct app.')
  })

  it('displays the correct error message when the addon is not destroyed', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const destroyApi = nock('https://api.heroku.com')
      .delete(`/apps/${addon.app?.id}/addons/${addon.id}`)
      .reply(404, {message: 'Test error'})

    const {error} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])
    resolveApi.done()
    destroyApi.done()
    expect(ansis.strip((error as Error).message)).to.equal('We can\'t destroy your database due to an error: Test error. Try again or open a ticket with Heroku Support: https://help.heroku.com/')
  })

  it('displays the correct error message when the addon status is not "deprovisioned"', async function () {
    const resolveApi = nock('https://api.heroku.com').post('/actions/addons/resolve').reply(200, [addon])
    const destroyApi = nock('https://api.heroku.com')
      .delete(`/apps/${addon.app?.id}/addons/${addon.id}`)
      .reply(200, {...destroyedAddonResponse, state: 'provisioning'})

    const {error} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])
    resolveApi.done()
    destroyApi.done()
    expect(ansis.strip((error as Error).message)).to.equal('You can\'t destroy a database with a provisioning status.')
  })
})
