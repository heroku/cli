import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Features from '../../../../src/commands/features/index.js'

type FakePlatform = {
  appFeature: {list: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    appFeature: {list: sinon.stub()},
  }
}

describe('features', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows the app features', async function () {
    fakePlatform.appFeature.list.resolves([
      {
        description: 'an app feature',
        enabled: true,
        name: 'feature a',
        state: 'general',
      },
    ])

    const {stderr, stdout} = await runCommand(Features, ['--app', 'myapp'])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(`=== App Features ⬢ myapp

[+] feature a  an app feature
`)
    expect(fakePlatform.appFeature.list.calledOnceWithExactly('myapp')).to.equal(true)
  })

  it('filters out non-general features', async function () {
    fakePlatform.appFeature.list.resolves([
      {
        description: 'a general feature',
        enabled: true,
        name: 'feature a',
        state: 'general',
      },
      {
        description: 'a beta feature',
        enabled: false,
        name: 'feature b',
        state: 'beta',
      },
    ])

    const {stdout} = await runCommand(Features, ['--app', 'myapp'])

    expect(stdout).to.contain('feature a')
    expect(stdout).to.not.contain('feature b')
  })

  it('shows features as json', async function () {
    const features = [
      {
        description: 'an app feature',
        enabled: true,
        name: 'feature a',
        state: 'general',
      },
    ]
    fakePlatform.appFeature.list.resolves(features)

    const {stdout} = await runCommand(Features, ['--app', 'myapp', '--json'])

    expect(JSON.parse(stdout)).to.deep.equal(features)
  })
})
