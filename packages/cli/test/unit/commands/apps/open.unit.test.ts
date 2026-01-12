import {expect} from 'chai'
import nock from 'nock'
import childProcess from 'node:child_process'
import sinon from 'sinon'

import OpenCommand from '../../../../src/commands/apps/open.js'
import runCommandHelper from '../../../helpers/runCommand.js'

describe('apps:open', function () {
  const app = {
    web_url: 'https://myapp.herokuapp.com',
  }
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
    sinon.restore()
  })

  it('opens the url', async function () {
    const spawnStub = sinon.stub(childProcess, 'spawn').returns({
      on(event: string, cb: CallableFunction) {
        if (event === 'exit') {
          cb()
        }
      }, unref() {},
    } as any)

    api
      .get('/apps/myapp')
      .reply(200, app)

    await runCommandHelper(OpenCommand, ['-a', 'myapp'])

    const urlArgArray = spawnStub.getCall(0).args[1]
    // For darwin-based platforms this arg is an array that contains the site url.
    // For windows-based platforms this arg is an array that contains an encoded command that includes the url
    const hasCorrectUrl = urlArgArray.includes('https://myapp.herokuapp.com/') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AbQB5AGEAcABwAC4AaABlAHIAbwBrAHUAYQBwAHAALgBjAG8AbQAvACIA')
    expect(hasCorrectUrl).to.be.true
  })

  it('opens the url with path', async function () {
    const spawnStub = sinon.stub(childProcess, 'spawn').returns({
      on(event: string, cb: CallableFunction) {
        if (event === 'exit') {
          cb()
        }
      }, unref() {},
    } as any)

    api
      .get('/apps/myapp')
      .reply(200, app)

    await runCommandHelper(OpenCommand, ['-a', 'myapp', '/mypath'])

    const urlArgArray = spawnStub.getCall(0).args[1]
    // For darwin-based platforms this arg is an array that contains the site url.
    // For windows-based platforms this arg is an array that contains an encoded command that includes the url
    const hasCorrectUrl = urlArgArray.includes('https://myapp.herokuapp.com/mypath') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AbQB5AGEAcABwAC4AaABlAHIAbwBrAHUAYQBwAHAALgBjAG8AbQAvAG0AeQBwAGEAdABoACIA')
    expect(hasCorrectUrl).to.be.true
  })
})
