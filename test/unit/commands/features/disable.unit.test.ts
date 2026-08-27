import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'

import FeaturesDisable from '../../../../src/commands/features/disable.js'

type FakePlatform = {
  appFeature: {
    info: sinon.SinonStub,
    update: sinon.SinonStub,
  },
}

function buildFakePlatform(): FakePlatform {
  return {
    appFeature: {
      info: sinon.stub(),
      update: sinon.stub(),
    },
  }
}

describe('features:disable', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('disables an app feature', async function () {
    fakePlatform.appFeature.info.resolves({enabled: true})
    fakePlatform.appFeature.update.resolves({enabled: false})

    const {stderr, stdout} = await runCommand(FeaturesDisable, ['-a', 'myapp', 'feature-a'])

    expect(stderr).to.include('Disabling feature-a for')
    expect(stderr).to.include('myapp')
    expect(stderr).to.include('done')
    expect(stdout).to.equal('')
    expect(fakePlatform.appFeature.info.calledOnceWithExactly('myapp', 'feature-a')).to.equal(true)
    expect(fakePlatform.appFeature.update.calledOnceWithExactly('myapp', 'feature-a', {enabled: false})).to.equal(true)
  })

  it('errors if feature is already disabled', async function () {
    fakePlatform.appFeature.info.resolves({enabled: false})

    const {error} = await runCommand(FeaturesDisable, ['-a', 'myapp', 'feature-a'])

    expect(ansis.strip(error?.message || '')).to.equal('feature-a is already disabled.')
    expect(fakePlatform.appFeature.update.called).to.equal(false)
  })
})
