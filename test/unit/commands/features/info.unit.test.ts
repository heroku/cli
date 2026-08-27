import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import FeaturesInfo from '../../../../src/commands/features/info.js'

type FakePlatform = {
  appFeature: {
    info: sinon.SinonStub,
  },
}

function buildFakePlatform(): FakePlatform {
  return {
    appFeature: {
      info: sinon.stub(),
    },
  }
}

describe('features:info', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows feature info', async function () {
    fakePlatform.appFeature.info.resolves({
      description: 'the description',
      doc_url: 'https://devcenter.heroku.com',
      enabled: true,
      name: 'myfeature',
    })

    const {stderr, stdout} = await runCommand(FeaturesInfo, ['-a', 'myapp', 'feature-a'])

    expect(stdout).to.eq(`=== myfeature

Description: the description
Docs:        https://devcenter.heroku.com
Enabled:     true
`)
    expect(stderr).to.equal('')
    expect(fakePlatform.appFeature.info.calledOnceWithExactly('myapp', 'feature-a')).to.equal(true)
  })
})
