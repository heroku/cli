import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'

import ConfigSet from '../../../../src/commands/config/set.js'

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

describe('config:set', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('sets a config var', async function () {
    fakePlatform.configVar.update.resolves({RACK_ENV: 'production', RAILS_ENV: 'production'})
    fakePlatform.release.list.resolves([{version: 10}])

    const {stderr, stdout} = await runCommand(ConfigSet, ['RACK_ENV=production', '--app', 'myapp'])

    expect(stdout).to.equal('RACK_ENV: production\n')
    expect(stderr).to.include('Setting RACK_ENV and restarting ⬢ myapp')
    expect(stderr).to.include('done, v10')
    expect(fakePlatform.configVar.update.calledOnceWithExactly('myapp', {RACK_ENV: 'production'})).to.equal(true)
    expect(fakePlatform.withHeaders.calledOnceWithExactly({Range: 'version ..; order=desc,max=1'})).to.equal(true)
    expect(fakePlatform.release.list.calledOnceWithExactly('myapp')).to.equal(true)
  })

  it('sets a config var with an "=" in it', async function () {
    fakePlatform.configVar.update.resolves({})
    fakePlatform.release.list.resolves([{version: 10}])

    const {stderr, stdout} = await runCommand(ConfigSet, ['RACK_ENV=production=foo', '--app', 'myapp'])

    expect(stdout).to.equal('\n')
    expect(stderr).to.include('Setting RACK_ENV and restarting ⬢ myapp')
    expect(stderr).to.include('done, v10')
    expect(fakePlatform.configVar.update.calledOnceWithExactly('myapp', {RACK_ENV: 'production=foo'})).to.equal(true)
  })

  it('errors without args', async function () {
    const {error} = await runCommand(ConfigSet, ['--app', 'myapp'])

    expect(error?.message).to.equal('Usage: heroku config:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.')
    expect(error?.oclif?.exit).to.equal(1)
  })

  it('errors with invalid args', async function () {
    const {error} = await runCommand(ConfigSet, ['--app', 'myapp', 'WRONG'])

    expect(ansis.strip(error?.message || '')).to.equal('WRONG is invalid. Must be in the format FOO=bar.')
    expect(error?.oclif?.exit).to.equal(1)
  })
})
