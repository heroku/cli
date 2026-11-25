import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/access/remove.js'

type FakePlatform = {
  appCollaborator: {remove: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    appCollaborator: {remove: sinon.stub()},
  }
}

describe('heroku access:remove', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    fakePlatform.appCollaborator.remove.resolves({user: {email: 'gandalf@heroku.com'}})
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  context('with either a personal or org app', function () {
    it('removes the user from an app', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      expect(stdout).to.eq('')
      expectOutput(stderr, 'Removing gandalf@heroku.com access from the app ⬢ myapp... done\n')
      expect(fakePlatform.appCollaborator.remove.calledOnceWithExactly('myapp', 'gandalf@heroku.com')).to.equal(true)
    })
  })
})
