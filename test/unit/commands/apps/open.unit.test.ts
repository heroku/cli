import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import childProcess from 'node:child_process'
import * as sinon from 'sinon'

import OpenCommand from '../../../../src/commands/apps/open.js'

type FakePlatform = {
  app: {info: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {info: sinon.stub()},
  }
}

describe('apps:open', function () {
  const app = {
    name: 'myapp',
    web_url: 'https://myapp.herokuapp.com/',
  }

  let fakePlatform: FakePlatform
  let spawnStub: sinon.SinonStub

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    spawnStub = sinon.stub(childProcess, 'spawn').returns({
      on(event: string, cb: CallableFunction) {
        if (event === 'exit') {
          cb()
        }
      }, unref() {},
    } as any)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('opens the url', async function () {
    fakePlatform.app.info.resolves(app)

    await runCommand(OpenCommand, ['-a', 'myapp'])

    const urlArgArray = spawnStub.getCall(0).args[1]
    // For darwin-based platforms this arg is an array that contains the site url.
    // For windows-based platforms this arg is an array that contains an encoded command that includes the url
    const hasCorrectUrl = urlArgArray.includes('https://myapp.herokuapp.com/') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AbQB5AGEAcABwAC4AaABlAHIAbwBrAHUAYQBwAHAALgBjAG8AbQAvACIA')
    expect(hasCorrectUrl).to.be.true
    expect(fakePlatform.app.info.calledOnceWithExactly('myapp')).to.equal(true)
  })

  it('opens the url with path', async function () {
    fakePlatform.app.info.resolves(app)

    await runCommand(OpenCommand, ['-a', 'myapp', '/mypath'])

    const urlArgArray = spawnStub.getCall(0).args[1]
    // For darwin-based platforms this arg is an array that contains the site url.
    // For windows-based platforms this arg is an array that contains an encoded command that includes the url
    const hasCorrectUrl = urlArgArray.includes('https://myapp.herokuapp.com/mypath') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AbQB5AGEAcABwAC4AaABlAHIAbwBrAHUAYQBwAHAALgBjAG8AbQAvAG0AeQBwAGEAdABoACIA')
    expect(hasCorrectUrl).to.be.true
  })
})
