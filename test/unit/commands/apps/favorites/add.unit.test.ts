import {runCommand} from '@heroku-cli/test-utils'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {
  AlreadyFavoriteError,
  AppNotFoundError,
  FavoriteCreateError,
} from '@heroku/sdk/extensions/dashboard-backend'
import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'

import Add from '../../../../../src/commands/apps/favorites/add.js'

const MY_APP = 'myapp'

type FakeDashboardBackend = {
  favorite: {addByAppName: SinonStub}
}

describe('apps:favorites:add', function () {
  let fakeDashboardBackend: FakeDashboardBackend
  let dashboardBackendInstances: Set<HerokuSDK>

  beforeEach(function () {
    dashboardBackendInstances = new Set()
    fakeDashboardBackend = {favorite: {addByAppName: sinon.stub()}}
    sinon.stub(HerokuSDK.prototype, 'dashboardBackend').get(function (this: HerokuSDK) {
      dashboardBackendInstances.add(this)
      return fakeDashboardBackend
    })
  })

  afterEach(function () {
    sinon.restore()
  })

  it('adds the app as a favorite using one SDK instance and the composite method', async function () {
    fakeDashboardBackend.favorite.addByAppName.resolves()

    const {error, result, stderr, stdout} = await runCommand(Add, [`--app=${MY_APP}`])

    expect(error).to.be.undefined
    expect(result).to.be.undefined
    expect(stdout).to.equal('')
    expect(stderr).to.equal(`Adding ⬢ ${MY_APP} to favorites... done\n`)
    expect(dashboardBackendInstances.size).to.equal(1)
    expect(fakeDashboardBackend.favorite.addByAppName.calledOnceWithExactly(MY_APP)).to.equal(true)
  })

  it('starts the spinner before the composite list/check and stops only after success', async function () {
    const events: string[] = []
    sinon.stub(ux.action, 'start').callsFake(() => {
      events.push('spinner:start')
    })
    sinon.stub(ux.action, 'stop').callsFake(() => {
      events.push('spinner:stop')
    })
    fakeDashboardBackend.favorite.addByAppName.callsFake(async () => {
      events.push('favorite:add')
    })

    const {error, result} = await runCommand(Add, [`--app=${MY_APP}`])

    expect(error).to.be.undefined
    expect(result).to.be.undefined
    expect(events).to.eql(['spinner:start', 'favorite:add', 'spinner:stop'])
  })

  it('maps AlreadyFavoriteError to the exact legacy message', async function () {
    fakeDashboardBackend.favorite.addByAppName.rejects(new AlreadyFavoriteError(MY_APP))

    const {error, stderr} = await runCommand(Add, [`--app=${MY_APP}`])

    expect(error?.message).to.equal(`${color.app(MY_APP)} is already a favorite app.`)
    expect(stderr).to.not.contain('... done')
  })

  it('maps AppNotFoundError through ux.error with the legacy text', async function () {
    const uxError = sinon.stub(ux, 'error').throws(new Error('App not found'))
    fakeDashboardBackend.favorite.addByAppName.rejects(new AppNotFoundError(MY_APP, new Error('404')))

    const {error} = await runCommand(Add, [`--app=${MY_APP}`])

    expect(uxError.calledOnceWithExactly('App not found')).to.equal(true)
    expect(error?.message).to.equal('App not found')
  })

  it('maps FavoriteCreateError to the original request error cause', async function () {
    const displayedCause = new Error('request cause')
    const originalError = new Error('request error', {cause: displayedCause})
    const uxError = sinon.stub(ux, 'error').throws(displayedCause)
    fakeDashboardBackend.favorite.addByAppName.rejects(new FavoriteCreateError(MY_APP, originalError))

    const {error} = await runCommand(Add, [`--app=${MY_APP}`])

    expect(uxError.calledOnceWithExactly(displayedCause)).to.equal(true)
    expect(error).to.equal(displayedCause)
  })

  it('preserves the absent original cause ux.error failure', async function () {
    const uxError = sinon.stub(ux, 'error').throws(new Error('first argument must be a string or instance of Error'))
    fakeDashboardBackend.favorite.addByAppName.rejects(new FavoriteCreateError(MY_APP, new Error('request error')))

    const {error} = await runCommand(Add, [`--app=${MY_APP}`])

    expect(uxError.calledOnce).to.equal(true)
    expect(uxError.firstCall.args).to.eql([undefined])
    expect(error?.message).to.equal('first argument must be a string or instance of Error')
  })

  it('passes through generic list failures unchanged and does not stop the spinner', async function () {
    const failure = new Error('favorite list failed')
    sinon.stub(ux.action, 'start')
    const actionStop = sinon.stub(ux.action, 'stop')
    fakeDashboardBackend.favorite.addByAppName.rejects(failure)

    const {error, stderr} = await runCommand(Add, [`--app=${MY_APP}`])

    expect(error).to.equal(failure)
    expect(actionStop.called).to.equal(false)
    expect(stderr).to.not.contain('... done')
  })
})
