import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import {GitClone as Clone} from '../../../../src/commands/git/clone.js'
import Git from '../../../../src/lib/git/git.js'

type FakePlatform = {
  app: {
    info: sinon.SinonStub
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {
      info: sinon.stub()
    },
  }
}

describe('git:clone', function () {
  let configureCredentialHelperStub: sinon.SinonStub
  let fakePlatform: FakePlatform
  let spawnStub: sinon.SinonStub

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)

    configureCredentialHelperStub = sinon.stub(Git.prototype, 'configureCredentialHelper').resolves()
    spawnStub = sinon.stub(Git.prototype, 'spawn').resolves()
  })

  afterEach(function () {
    sinon.restore()
  })

  it('errors if no app given', async function () {
    const {error} = await runCommand(Clone, [])

    expect(error?.message).to.contain('Missing required flag app')
  })

  it('configures git credential helper after cloning', async function () {
    fakePlatform.app.info.resolves({
      name: 'test-app',
    })

    await runCommand(Clone, ['-a', 'test-app'])

    expect(fakePlatform.app.info.calledOnceWithExactly('test-app')).to.equal(true)
    expect(configureCredentialHelperStub.calledOnce).to.be.true
  })
})
