import {HerokuSDK} from '@heroku/sdk'
import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import sinon from 'sinon'

import Cmd from '../../../../src/commands/orgs/open.js'

describe('heroku org:open', function () {
  let getWithDelinquencyStub: sinon.SinonStub
  let urlOpenerStub: sinon.SinonStub

  beforeEach(function () {
    urlOpenerStub = sinon.stub(Cmd, 'openUrl')
    getWithDelinquencyStub = sinon.stub()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => ({team: {getWithDelinquency: getWithDelinquencyStub}}))
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows an error if team flag is not passed', async function () {
    await runCommand(Cmd, [])
      .catch(error => {
        expect(error).to.be.instanceOf(Error)
      })
  })

  it('opens org in dashboard via browser if team flag is passed', async function () {
    getWithDelinquencyStub.resolves({delinquency: null, team: {name: 'myteam'}})

    await runCommand(Cmd, ['--team', 'myteam'])

    expect(getWithDelinquencyStub.calledOnceWithExactly('myteam')).to.equal(true)
    expect(urlOpenerStub.calledOnceWithExactly('https://dashboard.heroku.com/teams/myteam')).to.equal(true)
  })
})
