import {runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import sinon from 'sinon'

import Cmd from '../../../../src/commands/orgs/open.js'

describe('heroku org:open', function () {
  let getWithDelinquencyStub: sinon.SinonStub
  let urlOpenerStub: sinon.SinonStub

  beforeEach(function () {
    urlOpenerStub = sinon.stub(hux, 'openUrl').resolves(true)
    getWithDelinquencyStub = sinon.stub()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => ({team: {getWithDelinquency: getWithDelinquencyStub}}))
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows an error if team flag is not passed', async function () {
    const {error} = await runCommand(Cmd, [])
    expect(error).to.be.instanceOf(Error)
  })

  it('opens org in dashboard via browser if team flag is passed', async function () {
    getWithDelinquencyStub.resolves({delinquency: null, team: {name: 'myteam'}})

    await runCommand(Cmd, ['--team', 'myteam'])

    expect(getWithDelinquencyStub.calledOnceWithExactly('myteam')).to.equal(true)
    expect(urlOpenerStub.calledOnceWithExactly('https://dashboard.heroku.com/teams/myteam', {prompt: false})).to.equal(true)
  })

  it('exits 1 when the browser launcher can\'t be started', async function () {
    getWithDelinquencyStub.resolves({delinquency: null, team: {name: 'myteam'}})
    urlOpenerStub.resolves(false)

    const {error} = await runCommand(Cmd, ['--team', 'myteam'])

    expect(error?.oclif?.exit).to.equal(1)
  })
})
