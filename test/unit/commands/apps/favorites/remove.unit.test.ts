import {runCommand} from '@heroku-cli/test-utils'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {NotFavoriteError} from '@heroku/sdk/extensions/dashboard-backend'
import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'

import Remove from '../../../../../src/commands/apps/favorites/remove.js'

const MY_APP = 'myapp'

type FakeDashboardBackend = {
  favorite: {removeByAppName: SinonStub}
}

describe('apps:favorites:remove', function () {
  let fakeDashboardBackend: FakeDashboardBackend
  let dashboardBackendInstances: Set<HerokuSDK>

  beforeEach(function () {
    dashboardBackendInstances = new Set()
    fakeDashboardBackend = {favorite: {removeByAppName: sinon.stub()}}
    sinon.stub(HerokuSDK.prototype, 'dashboardBackend').get(function (this: HerokuSDK) {
      dashboardBackendInstances.add(this)
      return fakeDashboardBackend
    })
  })

  afterEach(function () {
    sinon.restore()
  })

  it('removes the app as a favorite using one SDK instance and the composite method', async function () {
    fakeDashboardBackend.favorite.removeByAppName.resolves()

    const {error, result, stderr, stdout} = await runCommand(Remove, [`--app=${MY_APP}`])

    expect(error).to.be.undefined
    expect(result).to.be.undefined
    expect(stdout).to.equal('')
    expect(stderr).to.equal(`Removing ⬢ ${MY_APP} from favorites... done\n`)
    expect(dashboardBackendInstances.size).to.equal(1)
    expect(fakeDashboardBackend.favorite.removeByAppName.calledOnceWithExactly(MY_APP)).to.equal(true)
  })

  it('starts the spinner before the composite list/check and stops only after success', async function () {
    const events: string[] = []
    sinon.stub(ux.action, 'start').callsFake(() => {
      events.push('spinner:start')
    })
    sinon.stub(ux.action, 'stop').callsFake(() => {
      events.push('spinner:stop')
    })
    fakeDashboardBackend.favorite.removeByAppName.callsFake(async () => {
      events.push('favorite:remove')
    })

    const {error, result} = await runCommand(Remove, [`--app=${MY_APP}`])

    expect(error).to.be.undefined
    expect(result).to.be.undefined
    expect(events).to.eql(['spinner:start', 'favorite:remove', 'spinner:stop'])
  })

  it('maps NotFavoriteError to the exact legacy message', async function () {
    fakeDashboardBackend.favorite.removeByAppName.rejects(new NotFavoriteError(MY_APP))

    const {error, stderr} = await runCommand(Remove, [`--app=${MY_APP}`])

    expect(error?.message).to.equal(`${color.app(MY_APP)} is not already a favorite app.`)
    expect(stderr).to.not.contain('... done')
  })

  it('passes through generic list failures unchanged and does not stop the spinner', async function () {
    const failure = new Error('favorite list failed')
    sinon.stub(ux.action, 'start')
    const actionStop = sinon.stub(ux.action, 'stop')
    fakeDashboardBackend.favorite.removeByAppName.rejects(failure)

    const {error, stderr} = await runCommand(Remove, [`--app=${MY_APP}`])

    expect(error).to.equal(failure)
    expect(actionStop.called).to.equal(false)
    expect(stderr).to.not.contain('... done')
  })

  it('passes through generic delete failures unchanged and does not stop the spinner', async function () {
    const failure = new Error('favorite delete failed')
    sinon.stub(ux.action, 'start')
    const actionStop = sinon.stub(ux.action, 'stop')
    fakeDashboardBackend.favorite.removeByAppName.rejects(failure)

    const {error, stderr} = await runCommand(Remove, [`--app=${MY_APP}`])

    expect(error).to.equal(failure)
    expect(actionStop.called).to.equal(false)
    expect(stderr).to.not.contain('... done')
  })
})
