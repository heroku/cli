import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import {ConfigIndex} from '../../../../src/commands/config/index.js'

type FakePlatform = {
  configVar: {
    infoForApp: sinon.SinonStub
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    configVar: {
      infoForApp: sinon.stub(),
    },
  }
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

  it('shows config vars', async function () {
    fakePlatform.configVar.infoForApp.resolves({LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(ConfigIndex, ['--app=myapp'])

    expect(stdout).to.equal('=== ⬢ myapp Config Vars\n\nLANG:     en_US.UTF-8\nRACK_ENV: production\n')
    expect(fakePlatform.configVar.infoForApp.calledOnceWithExactly('myapp')).to.equal(true)
  })

  it('--json', async function () {
    fakePlatform.configVar.infoForApp.resolves({LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(ConfigIndex, ['--app=myapp', '-j'])

    expect(JSON.parse(stdout)).to.deep.equal({LANG: 'en_US.UTF-8', RACK_ENV: 'production'})
  })

  it('--shell', async function () {
    fakePlatform.configVar.infoForApp.resolves({LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(ConfigIndex, ['--app=myapp', '-s'])

    expect(stdout).to.equal(`LANG=en_US.UTF-8
RACK_ENV=production
`)
  })
})
