// import Cmd from '../../../../src/commands/orgs/open'
import runCommand from '../../../helpers/runCommand.js'
import sinon from 'sinon'
import {expect} from 'chai'
import * as nock from 'nock'
import {teamInfo} from '../../../helpers/stubs/get.js'

/*
describe('heroku org:open', function () {
  let apiGetOrgInfo: nock.Scope
  let urlOpenerStub: sinon.SinonStub

  before(function () {
    urlOpenerStub = sinon.stub(Cmd, 'openUrl')
  })

  beforeEach(function () {
    apiGetOrgInfo = teamInfo()
    urlOpenerStub.reset()
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('shows an error if team flag is not passed', async function () {
    await runCommand(Cmd, [])
      .catch(error => {
        expect(error).to.be.instanceOf(Error)
      })
  })

  it('opens org in dashboard via browser if team flag is passed', async function () {
    await runCommand(Cmd, [
      '--team',
      'myteam',
    ])
      .then(() => apiGetOrgInfo.done())
      .then(() => expect(urlOpenerStub.called).to.equal(true))
  })
})

*/
