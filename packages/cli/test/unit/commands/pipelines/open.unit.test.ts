import {expect} from '@oclif/test'
import * as sinon from 'sinon'
import * as nock from 'nock'
import Cmd from '../../../../src/commands/pipelines/open'
import runCommand from '../../../helpers/runCommand'

describe('pipelines:open', () => {
  const pipeline = {id: '0123', name: 'Rigel'}
  const urlOpenerStub = sinon.stub(Cmd, 'urlOpener')

  it('opens the url', async () => {
    nock('https://api.heroku.com')
      .get('/pipelines')
      .query({eq: {name: pipeline.name}})
      .reply(200, [pipeline])
    await runCommand(Cmd, [pipeline.name])
    const urlArgArray = urlOpenerStub.getCall(0).args[0]
    // For darwin-based platforms this arg is an array that contains the site url.
    // For windows-based platforms this arg is an array that contains an encoded command that includes the url
    const hasCorrectUrl = urlArgArray.includes('https://dashboard.heroku.com/pipelines/0123') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AZABhAHMAaABiAG8AYQByAGQALgBoAGUAcgBvAGsAdQAuAGMAbwBtAC8AcABpAHAAZQBsAGkAbgBlAHMALwAwADEAMgAzACIA')
    expect(hasCorrectUrl).to.be.true
  })
})
