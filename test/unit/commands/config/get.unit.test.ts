import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import {ConfigGet} from '../../../../src/commands/config/get.js'

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

    const {stdout} = await runCommand(ConfigGet, ['--app=myapp', 'RACK_ENV'])

    expect(stdout).to.equal('production\n')
    expect(fakePlatform.configVar.infoForApp.calledOnceWithExactly('myapp')).to.equal(true)
  })

  it('--shell', async function () {
    fakePlatform.configVar.infoForApp.resolves({LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(ConfigGet, ['--app=myapp', '-s', 'RACK_ENV'])

    expect(stdout).to.equal('RACK_ENV=production\n')
  })

  it('missing', async function () {
    fakePlatform.configVar.infoForApp.resolves({LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(ConfigGet, ['--app=myapp', 'MISSING'])

    expect(stdout).to.equal('\n')
  })

  it('--json with unset var', async function () {
    fakePlatform.configVar.infoForApp.resolves({EMPTY_VAR: '', RACK_ENV: 'production'})

    const {stdout} = await runCommand(ConfigGet, ['--app=myapp', '--json', 'MISSING'])

    expect(JSON.parse(stdout)).to.deep.equal({key: 'MISSING', value: null})
  })

  it('--json with empty string var', async function () {
    fakePlatform.configVar.infoForApp.resolves({EMPTY_VAR: '', RACK_ENV: 'production'})

    const {stdout} = await runCommand(ConfigGet, ['--app=myapp', '--json', 'EMPTY_VAR'])

    expect(JSON.parse(stdout)).to.deep.equal({key: 'EMPTY_VAR', value: ''})
  })

  it('--json with normal var', async function () {
    fakePlatform.configVar.infoForApp.resolves({LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(ConfigGet, ['--app=myapp', '--json', 'RACK_ENV'])

    expect(JSON.parse(stdout)).to.deep.equal({key: 'RACK_ENV', value: 'production'})
  })

  it('--json with multiple vars', async function () {
    fakePlatform.configVar.infoForApp.resolves({EMPTY_VAR: '', RACK_ENV: 'production'})

    const {stdout} = await runCommand(ConfigGet, ['--app=myapp', '--json', 'MISSING', 'EMPTY_VAR', 'RACK_ENV'])

    expect(JSON.parse(stdout)).to.deep.equal([
      {key: 'MISSING', value: null},
      {key: 'EMPTY_VAR', value: ''},
      {key: 'RACK_ENV', value: 'production'},
    ])
  })
})
