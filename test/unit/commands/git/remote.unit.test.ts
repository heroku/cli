import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import {GitRemote as Remote} from '../../../../src/commands/git/remote.js'
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

describe('git:remote', function () {
  let configureCredentialHelperStub: sinon.SinonStub
  let execStub: sinon.SinonStub
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)

    configureCredentialHelperStub = sinon.stub(Git.prototype, 'configureCredentialHelper').resolves()
    execStub = sinon.stub(Git.prototype, 'exec').resolves('')
  })

  afterEach(function () {
    sinon.restore()
  })

  it('errors if no app given', async function () {
    const {error} = await runCommand(Remote, [])

    expect(error?.message).to.contain('Specify an app with --app')
  })

  it('configures git credential helper after adding remote', async function () {
    fakePlatform.app.info.resolves({
      name: 'test-app',
    })

    await runCommand(Remote, ['-a', 'test-app'])

    expect(fakePlatform.app.info.calledOnceWithExactly('test-app')).to.equal(true)
    expect(configureCredentialHelperStub.calledOnce).to.be.true
  })
})
