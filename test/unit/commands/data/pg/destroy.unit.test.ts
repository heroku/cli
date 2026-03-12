import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgDestroy from '../../../../../src/commands/data/pg/destroy.js'
import {addon, destroyedAddonResponse, nonPostgresAddon} from '../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('data:pg:destroy', function () {
  it('destroys a advanced addon', async function () {
    const resolveApi = nock('https://api.heroku.com').post('/actions/addons/resolve').reply(200, [addon])
    const destroyApi = nock('https://api.heroku.com')
      .delete(`/apps/${addon.app?.id}/addons/${addon.id}`)
      .reply(200, destroyedAddonResponse)

    await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])

    resolveApi.done()
    destroyApi.done()

    expect(ansis.strip(stderr.output)).to.equal(
      heredoc(`
        Destroying advanced-horizontal-01234 on ⬢ myapp... done
      `),
    )
    expect(stdout.output).to.equal('We successfully destroyed your database.\n')
  })

  it('bails if incorrect confirmation', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    try {
      await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=another-app'])
    } catch (error: unknown) {
      resolveApi.done()
      expect(ansis.strip((error as Error).message)).to.equal(
        `Confirmation another-app did not match myapp. Your database ${addon.name} still exists.`,
      )
    }
  })

  it('prevents destruction of add-ons other than Heroku Postgres', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonPostgresAddon])

    try {
      await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])
    } catch (error: unknown) {
      resolveApi.done()
      expect(ansis.strip((error as Error).message)).to.equal(
        'You can only use this command to delete Heroku Postgres databases. Run heroku addons:destroy redis-database instead.',
      )
    }
  })

  it('prevents destruction of addons attached to a different app', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    try {
      await runCommand(DataPgDestroy, [addon.name!, '--app=another-app'])
    } catch (error: unknown) {
      resolveApi.done()
      expect(ansis.strip((error as Error).message)).to.equal(
        'Database advanced-horizontal-01234 is on myapp not another-app. Try again with the correct app.',
      )
    }
  })

  it('displays the correct error message when the addon is not destroyed', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const destroyApi = nock('https://api.heroku.com')
      .delete(`/apps/${addon.app?.id}/addons/${addon.id}`)
      .reply(404, {message: 'Test error'})

    try {
      await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])
    } catch (error: unknown) {
      resolveApi.done()
      destroyApi.done()
      expect(ansis.strip((error as Error).message)).to.equal(
        'We can\'t destroy your database due to an error: Test error. Try again or open a ticket with Heroku Support: https://help.heroku.com/',
      )
    }
  })

  it('displays the correct error message when the addon status is not "deprovisioned"', async function () {
    const resolveApi = nock('https://api.heroku.com').post('/actions/addons/resolve').reply(200, [addon])
    const destroyApi = nock('https://api.heroku.com')
      .delete(`/apps/${addon.app?.id}/addons/${addon.id}`)
      .reply(200, {...destroyedAddonResponse, state: 'provisioning'})

    try {
      await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])
    } catch (error: unknown) {
      resolveApi.done()
      destroyApi.done()
      expect(ansis.strip((error as Error).message)).to.equal('You can\'t destroy a database with a provisioning status.')
    }
  })
})
