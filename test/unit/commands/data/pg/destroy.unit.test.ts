import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgDestroy from '../../../../../src/commands/data/pg/destroy.js'
import {addon, destroyedAddonResponse} from '../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc

interface FakePlatform {
  addOn: {delete: SinonStub; resolve: SinonStub}
  withHeaders: SinonStub
  withOptions: SinonStub
}

describe('data:pg:destroy', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = {
      addOn: {delete: stub(), resolve: stub()},
      withHeaders: stub(),
      withOptions: stub(),
    }
    // withHeaders/withOptions return the same fake so the chained delete
    // resolves to the stub above.
    fakePlatform.withHeaders.returns(fakePlatform)
    fakePlatform.withOptions.returns(fakePlatform)
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('destroys a advanced addon', async function () {
    fakePlatform.addOn.resolve.resolves(addon)
    fakePlatform.addOn.delete.resolves(destroyedAddonResponse)

    const {stderr, stdout} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])

    expect(fakePlatform.addOn.delete.calledOnceWithExactly(addon.app.id, addon.id)).to.equal(true)
    expect(ansis.strip(stderr)).to.equal(heredoc(`
        Destroying advanced-horizontal-01234 on ⬢ myapp... done
      `))
    expect(stdout).to.equal('We successfully destroyed your database.\n')
  })

  it('bails if incorrect confirmation', async function () {
    fakePlatform.addOn.resolve.resolves(addon)

    const {error} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=another-app'])
    expect(ansis.strip((error as Error).message)).to.equal(`Confirmation another-app did not match myapp. Your database ${addon.name} still exists.`)
    expect(fakePlatform.addOn.delete.called).to.equal(false)
  })

  it('doesn\'t destroy non-Postgres addons', async function () {
    // resolve filters by the Postgres add-on service; a non-Postgres identity
    // yields no match.
    fakePlatform.addOn.resolve.rejects(new Error('Couldn\'t find that addon.'))

    const {error} = await runCommand(DataPgDestroy, ['redis-database', '--app=myapp', '--confirm=myapp'])
    expect(ansis.strip((error as Error).message)).to.equal('Couldn\'t find that addon.')
    expect(fakePlatform.addOn.delete.called).to.equal(false)
  })

  it('prevents destruction of addons attached to a different app', async function () {
    fakePlatform.addOn.resolve.resolves(addon)

    const {error} = await runCommand(DataPgDestroy, [addon.name!, '--app=another-app'])
    expect(ansis.strip((error as Error).message)).to.equal('Database advanced-horizontal-01234 is on myapp not another-app. Try again with the correct app.')
    expect(fakePlatform.addOn.delete.called).to.equal(false)
  })

  it('displays the correct error message when the addon is not destroyed', async function () {
    fakePlatform.addOn.resolve.resolves(addon)
    fakePlatform.addOn.delete.rejects({body: {message: 'Test error'}})

    const {error} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])
    expect(ansis.strip((error as Error).message)).to.equal('We can\'t destroy your database due to an error: Test error. Try again or open a ticket with Heroku Support: https://help.heroku.com/')
  })

  it('displays the correct error message when the addon status is not "deprovisioned"', async function () {
    fakePlatform.addOn.resolve.resolves(addon)
    fakePlatform.addOn.delete.resolves({...destroyedAddonResponse, state: 'provisioning'})

    const {error} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])
    expect(ansis.strip((error as Error).message)).to.equal('You can\'t destroy a database with a provisioning status.')
  })
})
