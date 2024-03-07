import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'
import Cmd from '../../../../src/commands/apps/open'

const urlOpenerStub = sinon.stub()
describe('apps:open', () => {
  beforeEach(() => {
    urlOpenerStub.resetHistory()
  })
  const app = {
    web_url: 'https://myapp.herokuapp.com',
  }
  test
    .stdout()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, app),
    )
    .stub(Cmd, 'urlOpener', urlOpenerStub)
    .command(['apps:open', '-a', 'myapp'])
    .it('opens the url', () => {
      const urlArgArray = urlOpenerStub.getCall(0).args[0]
      // For darwin-based platforms this arg is an array that contains the site url.
      // For windows-based platforms this arg is an array that contains an encoded command that includes the url
      const hasCorrectUrl = urlArgArray.includes('https://myapp.herokuapp.com/') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AbQB5AGEAcABwAC4AaABlAHIAbwBrAHUAYQBwAHAALgBjAG8AbQAvACIA')
      expect(hasCorrectUrl).to.be.true
    })

  describe('apps:open reset stub', () => {
    beforeEach(() => {
      urlOpenerStub.resetHistory()
    })
    test
      .stdout()
      .nock('https://api.heroku.com', api =>
        api
          .get('/apps/myapp')
          .reply(200, app),
      )
      .stub(Cmd, 'urlOpener', urlOpenerStub)
      .command(['apps:open', '-a', 'myapp', '/mypath'])
      .it('opens the url with path', () => {
        const urlArgArray = urlOpenerStub.getCall(0).args[0]
        // For darwin-based platforms this arg is an array that contains the site url.
        // For windows-based platforms this arg is an array that contains an encoded command that includes the url
        const hasCorrectUrl = urlArgArray.includes('https://myapp.herokuapp.com/mypath') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AbQB5AGEAcABwAC4AaABlAHIAbwBrAHUAYQBwAHAALgBjAG8AbQAvAG0AeQBwAGEAdABoACIA')
        expect(hasCorrectUrl).to.be.true
      })
  })
})
