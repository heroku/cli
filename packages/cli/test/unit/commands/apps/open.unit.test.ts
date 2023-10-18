import {expect, test} from '@oclif/test'
import * as childProcess from 'child_process'
import * as sinon from 'sinon'

describe('apps:open', () => {
  const app = {
    web_url: 'https://myapp.herokuapp.com',
  }
  const spawnStub = sinon.stub().returns({unref: () => {}})

  test
    .stdout({print: true})
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, app),
    )
    .stub(childProcess, 'spawn', spawnStub)
    .command(['apps:open', '-a', 'myapp'])
    .it('opens the url', () => {
      const urlArgArray = spawnStub.getCall(0).args[1]
      console.log('urlArgArray is:', urlArgArray)
      // For darwin-based platforms this arg is an array that contains the site url.
      // For windows-based platforms this arg is an array that contains an encoded command that includes the url
      const hasCorrectUrl = urlArgArray.includes('https://myapp.herokuapp.com') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AbQB5AGEAcABwAC4AaABlAHIAbwBrAHUAYQBwAHAALgBjAG8AbQAiAA==')
      expect(hasCorrectUrl).to.be.true
    })
})
