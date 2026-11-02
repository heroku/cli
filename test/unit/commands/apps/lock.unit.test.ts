import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/apps/lock.js'

type FakePlatform = {
  teamApp: {
    info: sinon.SinonStub
    updateLocked: sinon.SinonStub
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    teamApp: {info: sinon.stub(), updateLocked: sinon.stub()},
  }
}

describe('heroku apps:lock', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('locks the canonical team app after preflight and returns undefined', async function () {
    fakePlatform.teamApp.info.resolves({locked: false, name: 'canonical-app'})
    fakePlatform.teamApp.updateLocked.resolves({})
    const start = sinon.spy(ux.action, 'start')
    const stop = sinon.spy(ux.action, 'stop')

    const {error, result, stderr, stdout} = await runCommand(Cmd, [
      '--app=app-alias',
      '--remote=staging',
    ])

    expect(error).to.be.undefined
    expect(result).to.be.undefined
    expect(stdout).to.equal('')
    expect(stderr).to.equal('Locking ⬢ canonical-app... done\n')
    expect(fakePlatform.teamApp.info.calledOnceWithExactly('app-alias')).to.equal(true)
    expect(fakePlatform.teamApp.updateLocked.calledOnceWithExactly('canonical-app', {locked: true})).to.equal(true)
    sinon.assert.callOrder(fakePlatform.teamApp.info, start, fakePlatform.teamApp.updateLocked, stop)
    expect(ansis.strip(start.firstCall.args[0])).to.equal('Locking ⬢ canonical-app')
  })

  it('preserves the exact already-locked preflight error without starting a spinner', async function () {
    fakePlatform.teamApp.info.resolves({locked: true, name: 'canonical-app'})
    const start = sinon.spy(ux.action, 'start')
    const stop = sinon.spy(ux.action, 'stop')

    const {error, stderr, stdout} = await runCommand(Cmd, ['--app=app-alias'])

    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
    expect(error).to.exist
    expect(ansis.strip(error!.message)).to.equal('Error: cannot lock ⬢ canonical-app.\nThis app is already locked.')
    expect(fakePlatform.teamApp.info.calledOnceWithExactly('app-alias')).to.equal(true)
    expect(fakePlatform.teamApp.updateLocked.called).to.equal(false)
    expect(start.called).to.equal(false)
    expect(stop.called).to.equal(false)
  })

  it('falls back to the requested app name when the team app response omits its name', async function () {
    fakePlatform.teamApp.info.resolves({locked: false})
    fakePlatform.teamApp.updateLocked.resolves({})

    const {error, stderr} = await runCommand(Cmd, ['--app=myapp'])

    expect(error).to.be.undefined
    expect(stderr).to.equal('Locking ⬢ myapp... done\n')
    expect(fakePlatform.teamApp.info.calledOnceWithExactly('myapp')).to.equal(true)
    expect(fakePlatform.teamApp.updateLocked.calledOnceWithExactly('myapp', {locked: true})).to.equal(true)
  })

  it('passes through a team app preflight request failure without starting a spinner', async function () {
    const requestError = new Error('team app info failed')
    fakePlatform.teamApp.info.rejects(requestError)
    const start = sinon.spy(ux.action, 'start')
    const stop = sinon.spy(ux.action, 'stop')

    const {error, stderr, stdout} = await runCommand(Cmd, ['--app=myapp'])

    expect(error).to.equal(requestError)
    expect(stderr).to.equal('')
    expect(stdout).to.equal('')
    expect(fakePlatform.teamApp.info.calledOnceWithExactly('myapp')).to.equal(true)
    expect(fakePlatform.teamApp.updateLocked.called).to.equal(false)
    expect(start.called).to.equal(false)
    expect(stop.called).to.equal(false)
  })

  it('does not stop the spinner or replace a generic update failure', async function () {
    const requestError = new Error('team app update failed')
    fakePlatform.teamApp.info.resolves({locked: false, name: 'canonical-app'})
    fakePlatform.teamApp.updateLocked.rejects(requestError)
    const start = sinon.stub(ux.action, 'start')
    const stop = sinon.stub(ux.action, 'stop')

    const {error, stderr, stdout} = await runCommand(Cmd, ['--app=app-alias'])

    expect(error).to.equal(requestError)
    expect(stderr).to.equal('')
    expect(stdout).to.equal('')
    expect(fakePlatform.teamApp.info.calledOnceWithExactly('app-alias')).to.equal(true)
    expect(fakePlatform.teamApp.updateLocked.calledOnceWithExactly('canonical-app', {locked: true})).to.equal(true)
    sinon.assert.callOrder(fakePlatform.teamApp.info, start, fakePlatform.teamApp.updateLocked)
    expect(stop.called).to.equal(false)
  })
})
