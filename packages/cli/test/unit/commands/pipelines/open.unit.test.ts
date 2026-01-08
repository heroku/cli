import {expect} from 'chai'
import childProcess from 'child_process'
import nock from 'nock'
import sinon from 'sinon'

import OpenCommand from '../../../../src/commands/pipelines/open.js'
import runCommandHelper from '../../../helpers/runCommand.js'

describe('pipelines:open', function () {
  const pipeline = {id: '0123', name: 'Rigel'}

  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
  })

  it('opens the url', async function () {
    let hasCorrectUrl = false
    const spawnStub = sinon.stub(childProcess, 'spawn').returns({
      on(event: string, cb: CallableFunction) {
        if (event === 'exit') {
          cb()
        }
      }, unref() {},
    } as any)

    nock('https://api.heroku.com')
      .get('/pipelines')
      .query({eq: {name: pipeline.name}})
      .reply(200, [pipeline])

    await runCommandHelper(OpenCommand, [pipeline.name])

    const urlArgArray = spawnStub.getCall(0).args[1]
    // For darwin-based platforms this arg is an array that contains the site url.
    // For windows-based platforms this arg is an array that contains an encoded command that includes the url
    hasCorrectUrl = urlArgArray.includes('https://dashboard.heroku.com/pipelines/0123') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AZABhAHMAaABiAG8AYQByAGQALgBoAGUAcgBvAGsAdQAuAGMAbwBtAC8AcABpAHAAZQBsAGkAbgBlAHMALwAwADEAMgAzACIA')
    expect(hasCorrectUrl).to.be.true
  })
})
