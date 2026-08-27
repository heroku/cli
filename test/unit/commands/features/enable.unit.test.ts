import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'

import FeaturesEnable from '../../../../src/commands/features/enable.js'

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

describe('features:enable', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('enables an app feature', async function () {
    fakePlatform.appFeature.info.resolves({enabled: false})
    fakePlatform.appFeature.update.resolves({enabled: true})

    const {stderr, stdout} = await runCommand(FeaturesEnable, ['feature-a', '--app', 'myapp'])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Enabling feature-a for')
    expect(stderr).to.contain('myapp')
    expect(stderr).to.contain('done')
    expect(fakePlatform.appFeature.info.calledOnceWithExactly('myapp', 'feature-a')).to.equal(true)
    expect(fakePlatform.appFeature.update.calledOnceWithExactly('myapp', 'feature-a', {enabled: true})).to.equal(true)
  })

  it('errors if feature is already enabled', async function () {
    fakePlatform.appFeature.info.resolves({enabled: true})

    const {error} = await runCommand(FeaturesEnable, ['-a', 'myapp', 'feature-a'])

    expect(ansis.strip(error?.message || '')).to.equal('feature-a is already enabled.')
    expect(fakePlatform.appFeature.update.called).to.equal(false)
  })
})
