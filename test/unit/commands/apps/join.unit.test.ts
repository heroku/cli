import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/apps/join.js'

describe('heroku apps:join', function () {
  let joinSelf: SinonStub
  let actionStart: SinonStub
  let actionStop: SinonStub
  let events: string[]

  beforeEach(function () {
    events = []
    joinSelf = stub().callsFake(async () => {
      events.push('joinSelf')
    })
    stub(HerokuSDK.prototype, 'platform').get(() => {
      events.push('platform')
      return {teamApp: {joinSelf}}
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
  })

  afterEach(function () {
    restore()
  })

  it('joins the app through teamApp.joinSelf after starting the spinner', async function () {
    const {error, result, stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp'])

    expect(error).to.be.undefined
    expect(result).to.be.undefined
    expect(stdout).to.equal('')
    expect(stderr).to.equal('Joining ⬢ myapp... done\n')
    expect(events).to.deep.equal(['start', 'platform', 'joinSelf', 'stop'])
    expect(joinSelf.calledOnceWithExactly('myapp')).to.equal(true)
    expect(actionStart.calledOnce).to.equal(true)
    expect(actionStop.calledOnce).to.equal(true)
  })

  it('does not stop the spinner when joining fails', async function () {
    const failure = new Error('forbidden')
    joinSelf.callsFake(async () => {
      events.push('joinSelf')
      throw failure
    })

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp'])

    expect(error).to.equal(failure)
    expect(stderr).to.equal('Joining ⬢ myapp... ')
    expect(events).to.deep.equal(['start', 'platform', 'joinSelf'])
    expect(joinSelf.calledOnceWithExactly('myapp')).to.equal(true)
    expect(actionStop.called).to.equal(false)
  })
})
