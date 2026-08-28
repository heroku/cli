import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import {ConfigUnset} from '../../../../src/commands/config/unset.js'

type FakePlatform = {
  configVar: {
    update: sinon.SinonStub
  }
  release: {
    list: sinon.SinonStub
  }
  withHeaders: sinon.SinonStub
}

function buildFakePlatform(): FakePlatform {
  const platform: FakePlatform = {
    configVar: {
      update: sinon.stub(),
    },
    release: {
      list: sinon.stub(),
    },
    withHeaders: sinon.stub(),
  }
  platform.withHeaders.returns(platform)
  return platform
}

describe('config', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('removes 2 config vars', async function () {
    fakePlatform.configVar.update.resolves({})
    fakePlatform.release.list.resolves([{version: 1}])

    await runCommand(ConfigUnset, ['-amyapp', 'FOO', 'RACK_ENV'])

    expect(fakePlatform.configVar.update.calledOnceWithExactly('myapp', {
      FOO: null,
      RACK_ENV: null,
    })).to.equal(true)
    expect(fakePlatform.withHeaders.calledOnceWithExactly({Range: 'version ..; order=desc,max=1'})).to.equal(true)
    expect(fakePlatform.release.list.calledOnceWithExactly('myapp')).to.equal(true)
  })
})
