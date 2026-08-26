import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/releases/info.js'

const heredoc = tsheredoc.default

const createdAt = new Date(2000, 1, 1).toISOString()

type FakePlatform = {
  configVar: {
    infoForAppRelease: sinon.SinonStub,
  }
  release: {
    info: sinon.SinonStub,
    list: sinon.SinonStub,
  }
  withHeaders: sinon.SinonStub,
}

function buildFakePlatform(): FakePlatform {
  const platform: FakePlatform = {
    configVar: {
      infoForAppRelease: sinon.stub(),
    },
    release: {
      info: sinon.stub(),
      list: sinon.stub(),
    },
    withHeaders: sinon.stub(),
  }
  platform.withHeaders.returns(platform)
  return platform
}

describe('releases:info', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  const release = {
    addon_plan_names: ['addon1', 'addon2'],
    created_at: createdAt,
    description: 'something changed',
    eligible_for_rollback: true,
    user: {
      email: 'foo@foo.com',
    },
    version: 10,
  }

  // eslint-disable-next-line perfectionist/sort-objects
  const configVars = {FOO: 'foo', BAR: 'bar'}

  it('shows most recent release info', async function () {
    fakePlatform.release.list.resolves([release])
    fakePlatform.configVar.infoForAppRelease.resolves(configVars)
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout, heredoc(`
      === Release v10
      Add-ons:                addon1
                              addon2
      By:                     foo@foo.com
      Change:                 something changed
      Eligible for Rollback?: Yes
      When:                   ${createdAt}

      === v10 Config vars

      FOO: foo
      BAR: bar
    `))
    expect(fakePlatform.release.list.calledOnceWithExactly('myapp')).to.equal(true)
    expect(fakePlatform.configVar.infoForAppRelease.calledOnceWithExactly('myapp', 10)).to.equal(true)
  })

  it('shows most recent release info config vars as shell', async function () {
    fakePlatform.release.list.resolves([release])
    fakePlatform.configVar.infoForAppRelease.resolves(configVars)
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--shell',
    ])
    expectOutput(stdout, heredoc(`
      === Release v10
      Add-ons:                addon1
                              addon2
      By:                     foo@foo.com
      Change:                 something changed
      Eligible for Rollback?: Yes
      When:                   ${createdAt}

      === v10 Config vars

      FOO=foo
      BAR=bar
    `))
  })

  it('shows release info by id', async function () {
    fakePlatform.release.info.resolves(release)
    fakePlatform.configVar.infoForAppRelease.resolves(configVars)
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])
    expectOutput(stdout, heredoc(`
      === Release v10
      Add-ons:                addon1
                              addon2
      By:                     foo@foo.com
      Change:                 something changed
      Eligible for Rollback?: Yes
      When:                   ${createdAt}

      === v10 Config vars

      FOO: foo
      BAR: bar
    `))
    expect(fakePlatform.release.info.calledOnceWithExactly('myapp', '10')).to.equal(true)
    expect(fakePlatform.configVar.infoForAppRelease.calledOnceWithExactly('myapp', 10)).to.equal(true)
  })

  it('shows recent release as json', async function () {
    fakePlatform.release.info.resolves(release)
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--json',
      'v10',
    ])
    expect(stdout).to.contain('"version": 10')
    expect(fakePlatform.release.info.calledOnceWithExactly('myapp', '10')).to.equal(true)
    expect(fakePlatform.configVar.infoForAppRelease.called).to.equal(false)
  })

  it('shows a failed release info', async function () {
    fakePlatform.release.list.resolves([{
      created_at: createdAt,
      description: 'something changed',
      eligible_for_rollback: false,
      status: 'failed',
      user: {email: 'foo@foo.com'},
      version: 10,
    }])
    fakePlatform.configVar.infoForAppRelease.resolves(configVars)
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout, heredoc(`
      === Release v10
      By:                     foo@foo.com
      Change:                 something changed (release command failed)
      Eligible for Rollback?: No
      When:                   ${createdAt}

      === v10 Config vars

      FOO: foo
      BAR: bar
    `))
  })

  it('shows a pending release info', async function () {
    fakePlatform.release.list.resolves([{
      addon_plan_names: ['addon1', 'addon2'],
      created_at: createdAt,
      description: 'something changed',
      eligible_for_rollback: false,
      status: 'pending',
      user: {email: 'foo@foo.com'},
      version: 10,
    }])
    fakePlatform.configVar.infoForAppRelease.resolves(configVars)
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout, heredoc(`
      === Release v10
      Add-ons:                addon1
                              addon2
      By:                     foo@foo.com
      Change:                 something changed (release command executing)
      Eligible for Rollback?: No
      When:                   ${createdAt}

      === v10 Config vars

      FOO: foo
      BAR: bar
    `))
  })

  it("shows an expired release's info", async function () {
    fakePlatform.release.list.resolves([{
      created_at: createdAt,
      description: 'something changed',
      eligible_for_rollback: false,
      status: 'expired',
      user: {email: 'foo@foo.com'},
      version: 10,
    }])
    fakePlatform.configVar.infoForAppRelease.resolves(configVars)
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout, heredoc(`
      === Release v10
      By:                     foo@foo.com
      Change:                 something changed (release expired)
      Eligible for Rollback?: No
      When:                   ${createdAt}

      === v10 Config vars

      FOO: foo
      BAR: bar
    `))
  })
})
