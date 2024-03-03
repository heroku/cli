import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/orgs/open'
import runCommand from '../../../helpers/runCommand'
const sinon = require('sinon')
const expect = require('chai').expect
import * as nock from 'nock'
import {teamInfo} from '../../../helpers/stubs/get'

describe('heroku org:open', () => {
  let apiGetOrgInfo: nock.Scope
  const urlOpenerStub = sinon.stub(Cmd, 'openUrl').callsFake(async (_: string) => {})

  beforeEach(() => {
    apiGetOrgInfo = teamInfo()
    urlOpenerStub.reset()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('shows an error if team flag is not passed', function () {
    runCommand(Cmd, [])
      .catch(error => {
        expect(error).to.be.instanceOf(Error)
      })
  })
  it('opens org in dashboard via browser if team flag is passed', function () {
    return runCommand(Cmd, [
      '--team',
      'myteam',
    ])
      .then(() => apiGetOrgInfo.done())
      .then(() => expect(urlOpenerStub.called).to.equal(true))
  })
})
