import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {AddonAppMismatchError, AddonDestroyFailedError} from '@heroku/sdk/resources/data/postgres-database'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgDestroy from '../../../../../src/commands/data/pg/destroy.js'
import {addon, advancedAddon, destroyedAddonResponse} from '../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc

interface FakeData {
  postgresDatabase: {destroy: SinonStub}
}

type DestroyOptions = {
  appIdentity?: string
  beforeDestroy?: (preview: {addon: typeof addon}) => Promise<void> | void
  force?: boolean
}

// The command owns the confirmation prompt and status rendering but delegates
// resolution + delete to the SDK. These fakes stand in for the resolving
// `data.postgresDatabase.destroy`, invoking the command's `beforeDestroy`
// callback the way the real method does so the confirm/render path is covered.
const destroyResolvingWith = (result: unknown) => async (_db: string, options: DestroyOptions = {}) => {
  await options.beforeDestroy?.({addon})
  return {addon, result}
}

const destroyFailingWith = (error: unknown) => async (_db: string, options: DestroyOptions = {}) => {
  await options.beforeDestroy?.({addon})
  throw error
}

describe('data:pg:destroy', function () {
  let fakeData: FakeData

  beforeEach(function () {
    fakeData = {postgresDatabase: {destroy: stub()}}
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
  })

  afterEach(function () {
    restore()
  })

  it('destroys a advanced addon', async function () {
    fakeData.postgresDatabase.destroy.callsFake(destroyResolvingWith(destroyedAddonResponse))

    const {stderr, stdout} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])

    expect(fakeData.postgresDatabase.destroy.calledOnce).to.equal(true)
    const [identity, options] = fakeData.postgresDatabase.destroy.firstCall.args
    expect(identity).to.equal(addon.name)
    expect(options.appIdentity).to.equal('myapp')
    expect(options.force).to.equal(false)
    expect(ansis.strip(stderr)).to.equal(heredoc(`
        Destroying advanced-horizontal-01234 on ⬢ myapp... done
      `))
    expect(stdout).to.equal('We successfully destroyed your database.\n')
  })

  it('bails if incorrect confirmation', async function () {
    fakeData.postgresDatabase.destroy.callsFake(destroyResolvingWith(destroyedAddonResponse))

    const {error, stdout} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=another-app'])
    expect(ansis.strip((error as Error).message)).to.equal(`Confirmation another-app did not match myapp. Your database ${addon.name} still exists.`)
    expect(stdout).to.not.include('We successfully destroyed your database.')
  })

  it('doesn\'t destroy non-Postgres addons', async function () {
    // The SDK resolves scoped to the Postgres add-on service; a non-Postgres
    // identity yields no match and the method rejects before confirming.
    fakeData.postgresDatabase.destroy.rejects(new Error('Couldn\'t find that addon.'))

    const {error} = await runCommand(DataPgDestroy, ['redis-database', '--app=myapp', '--confirm=myapp'])
    expect(ansis.strip((error as Error).message)).to.equal('Couldn\'t find that addon.')
  })

  it('scopes resolution to the --app flag and surfaces an app mismatch', async function () {
    // Resolution is scoped by appIdentity; when the database exists under a
    // different app the SDK raises AddonAppMismatchError, which the command
    // surfaces as-is (the delete never fires, so no tier-specific wrapping).
    fakeData.postgresDatabase.destroy.rejects(new AddonAppMismatchError(advancedAddon, 'another-app'))

    const {error} = await runCommand(DataPgDestroy, [addon.name!, '--app=another-app'])
    expect(fakeData.postgresDatabase.destroy.firstCall.args[1].appIdentity).to.equal('another-app')
    expect(ansis.strip((error as Error).message)).to.equal(`Database ${advancedAddon.name} is on ${advancedAddon.app.name} not another-app. Try again with the correct app.`)
  })

  it('reports background deprovisioning without claiming success', async function () {
    fakeData.postgresDatabase.destroy.callsFake(destroyResolvingWith({...destroyedAddonResponse, state: 'deprovisioning'}))

    const {stderr, stdout} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])

    expect(ansis.strip(stderr)).to.equal(heredoc(`
        Destroying advanced-horizontal-01234 on ⬢ myapp... pending
      `))
    const out = ansis.strip(stdout)
    expect(out).to.include(`${addon.name} is being destroyed in the background. The app will restart when complete...`)
    expect(out).to.include(`Run heroku addons:info ${addon.name} to check destruction progress`)
    expect(out).to.not.include('We successfully destroyed your database.')
  })

  it('displays the correct error message when the addon is not destroyed', async function () {
    fakeData.postgresDatabase.destroy.callsFake(destroyFailingWith(new AddonDestroyFailedError(advancedAddon, {body: {message: 'Test error'}})))

    const {error, stderr} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])
    expect(ansis.strip((error as Error).message)).to.equal('We can\'t destroy your database due to an error: Test error. Try again or open a ticket with Heroku Support: https://help.heroku.com/')
    expect(ansis.strip(stderr)).to.equal(heredoc(`
        Destroying advanced-horizontal-01234 on ⬢ myapp... !
      `))
  })

  it('displays the correct error message when the addon status is not "deprovisioned"', async function () {
    fakeData.postgresDatabase.destroy.callsFake(destroyResolvingWith({...destroyedAddonResponse, state: 'provisioning'}))

    const {error, stderr} = await runCommand(DataPgDestroy, [addon.name!, '--app=myapp', '--confirm=myapp'])
    expect(ansis.strip((error as Error).message)).to.equal('You can\'t destroy a database with a provisioning status.')
    expect(ansis.strip(stderr)).to.equal(heredoc(`
        Destroying advanced-horizontal-01234 on ⬢ myapp... !
      `))
  })
})
