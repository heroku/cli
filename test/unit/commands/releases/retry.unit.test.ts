import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/releases/retry.js'

type FakePlatform = {
  formation: {
    list: sinon.SinonStub,
  }
  release: {
    create: sinon.SinonStub,
    list: sinon.SinonStub,
  }
  withHeaders: sinon.SinonStub,
}

function buildFakePlatform(): FakePlatform {
  const platform: FakePlatform = {
    formation: {
      list: sinon.stub(),
    },
    release: {
      create: sinon.stub(),
      list: sinon.stub(),
    },
    withHeaders: sinon.stub(),
  }
  platform.withHeaders.returns(platform)
  return platform
}

describe('releases:retry', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
  })

  const release = [{
    description: 'A release',
    slug: {id: 'slug_uuid'},
    version: 40,
  }]

  const formationWithReleasePhase = [
    {
      type: 'release',
    },
    {
      type: 'web',
    },
  ]

  const formationWithoutReleasePhase = [{
    type: 'web',
  }]

  const releaseRetry = {
    description: 'Retry of v40: A release',
    slug: 'slug_uuid',
  }

  it('errors when there are no releases yet', async function () {
    fakePlatform.release.list.resolves([])
    fakePlatform.formation.list.resolves([])

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch((error: Error) => {
      expect(ansis.strip(error.message)).to.eq('No release found for ⬢ myapp.')
    })
    expect(fakePlatform.release.list.calledOnceWithExactly('myapp')).to.equal(true)
    expect(fakePlatform.formation.list.calledOnceWithExactly('myapp')).to.equal(true)
  })

  it('retries the release', async function () {
    fakePlatform.release.list.resolves(release)
    fakePlatform.formation.list.resolves(formationWithReleasePhase)
    fakePlatform.release.create.resolves({})
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect(fakePlatform.release.create.calledOnceWithExactly('myapp', releaseRetry)).to.equal(true)
  })

  it('shows the output from the latest release', async function () {
    const busl = nock('https://busl.test')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')

    fakePlatform.release.list.resolves(release)
    fakePlatform.formation.list.resolves(formationWithReleasePhase)
    fakePlatform.release.create.resolves({output_stream_url: 'https://busl.test/streams/release.log'})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    busl.done()
    expect(stderr).to.contain('Retrying v40 on')
    expect(stderr).to.contain('myapp')
    expect(stdout).to.contain('Release Output Content')
    expect(fakePlatform.release.create.calledOnceWithExactly('myapp', releaseRetry)).to.equal(true)
  })

  it('errors if app does not use release-phase', async function () {
    fakePlatform.release.list.resolves(release)
    fakePlatform.formation.list.resolves(formationWithoutReleasePhase)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch((error: Error) => {
      expect(error.message).to.eq('App must have a release-phase command to use this command.')
    })
    expect(fakePlatform.release.create.called).to.equal(false)
  })
})
