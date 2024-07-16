import {expect, test} from '@oclif/test'
import * as childProcess from 'child_process'
import * as sinon from 'sinon'

describe('pipelines:open', function () {
  const pipeline = {id: '0123', name: 'Rigel'}
  const spawnStub = sinon.stub().returns({unref: () => {}})

  test
    .stdout()
    .nock('https://api.heroku.com', api =>
      api
        .get('/pipelines')
        .query({eq: {name: pipeline.name}})
        .reply(200, [pipeline]),
    )
    .stub(childProcess, 'spawn', spawnStub)
    .command(['pipelines:open', pipeline.name])
    .it('opens the url', () => {
      const urlArgArray = spawnStub.getCall(0).args[1]
      // For darwin-based platforms this arg is an array that contains the site url.
      // For windows-based platforms this arg is an array that contains an encoded command that includes the url
      const hasCorrectUrl = urlArgArray.includes('https://dashboard.heroku.com/pipelines/0123') || urlArgArray.includes('UwB0AGEAcgB0ACAAIgBoAHQAdABwAHMAOgAvAC8AZABhAHMAaABiAG8AYQByAGQALgBoAGUAcgBvAGsAdQAuAGMAbwBtAC8AcABpAHAAZQBsAGkAbgBlAHMALwAwADEAMgAzACIA')
      expect(hasCorrectUrl).to.be.true
    })
})
