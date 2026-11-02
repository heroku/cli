import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import LeaveCommand from '../../../../src/commands/apps/leave.js'

const account = {email: 'gandalf@heroku.com'}
const delinquency = {scheduled_deletion_time: null, scheduled_suspension_time: null}

describe('heroku apps:leave', function () {
  let removeSelf: SinonStub
  let actionStart: SinonStub
  let actionStop: SinonStub
  let warn: SinonStub
  let events: string[]

  beforeEach(function () {
    events = []
    removeSelf = stub().callsFake(async (_app, options: {beforeRemove: (args: {account: typeof account, delinquency: typeof delinquency}) => Promise<void>}) => {
      events.push('removeSelf')
      await options.beforeRemove({account, delinquency})
      events.push('delete')
    })
    stub(HerokuSDK.prototype, 'platform').get(() => {
      events.push('platform')
      return {appCollaborator: {removeSelf}}
    })
    const originalActionStart = ux.action.start.bind(ux.action)
    const originalActionStop = ux.action.stop.bind(ux.action)
    actionStart = stub(ux.action, 'start').callsFake(function (...args) {
      events.push('start')
      return originalActionStart(...args)
    })
    actionStop = stub(ux.action, 'stop').callsFake(function (...args) {
      events.push('stop')
      return originalActionStop(...args)
    })
    const originalWarn = LeaveCommand.prototype.warn
    warn = stub(LeaveCommand.prototype, 'warn').callsFake(function (this: LeaveCommand, warning: Error | string) {
      events.push('warn')
      return originalWarn.call(this, warning)
    })
  })

  afterEach(function () {
    restore()
  })

  it('warns and starts the spinner before removing the authenticated user', async function () {
    const {error, result, stderr, stdout} = await runCommand(LeaveCommand, ['--app', 'myapp'])

    expect(error).to.be.undefined
    expect(result).to.be.undefined
    expect(stdout).to.equal('')
    expect(stderr).to.equal('Leaving ⬢ myapp... done\n')
    expect(events).to.deep.equal(['platform', 'removeSelf', 'start', 'delete', 'stop'])
    expect(removeSelf.calledOnce).to.equal(true)
    expect(removeSelf.firstCall.args[0]).to.equal('myapp')
    expect(removeSelf.firstCall.args[1]).to.have.keys(['beforeRemove'])
    expect(removeSelf.firstCall.args[1].beforeRemove).to.be.a('function')
    expect(warn.called).to.equal(false)
    expect(actionStart.calledOnce).to.equal(true)
    expect(actionStop.calledOnce).to.equal(true)
  })

  it('includes an explicit account delinquency warning before the spinner', async function () {
    const warningDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
    removeSelf.callsFake(async (_app, options) => {
      events.push('removeSelf')
      await options.beforeRemove({
        account,
        delinquency: {...delinquency, scheduled_suspension_time: warningDate},
      })
      events.push('delete')
    })

    const {error, stderr} = await runCommand(LeaveCommand, ['--app', 'myapp'])

    expect(error).to.be.undefined
    expect(stderr).to.include('Warning: This account is delinquent with payment')
    expect(stderr).to.include(new Date(warningDate).toUTCString())
    expect(stderr.indexOf('Warning:')).to.be.lessThan(stderr.indexOf('Leaving ⬢ myapp... done'))
    expect(events).to.deep.equal(['platform', 'removeSelf', 'warn', 'start', 'delete', 'stop'])
    expect(warn.calledOnce).to.equal(true)
    expect(warn.firstCall.args[0]).to.contain('account is delinquent with payment')
  })

  it('does not start or stop the spinner or delete when the warning callback rejects', async function () {
    const failure = new Error('warning failed')
    warn.callsFake(function () {
      events.push('warn')
      throw failure
    })
    removeSelf.callsFake(async (_app, options) => {
      events.push('removeSelf')
      await options.beforeRemove({
        account,
        delinquency: {...delinquency, scheduled_suspension_time: new Date(Date.now() + 60_000).toISOString()},
      })
      events.push('delete')
    })

    const {error, stderr} = await runCommand(LeaveCommand, ['--app', 'myapp'])

    expect(error).to.equal(failure)
    expect(stderr).to.equal('')
    expect(events).to.deep.equal(['platform', 'removeSelf', 'warn'])
    expect(actionStart.called).to.equal(false)
    expect(actionStop.called).to.equal(false)
  })

  it('does not stop the spinner when removal fails', async function () {
    const failure = new Error('delete failed')
    removeSelf.callsFake(async (_app, options) => {
      events.push('removeSelf')
      await options.beforeRemove({account, delinquency})
      events.push('delete')
      throw failure
    })

    const {error, stderr} = await runCommand(LeaveCommand, ['--app', 'myapp'])

    expect(error).to.equal(failure)
    expect(stderr).to.equal('Leaving ⬢ myapp... ')
    expect(events).to.deep.equal(['platform', 'removeSelf', 'start', 'delete'])
    expect(actionStop.called).to.equal(false)
  })
})
