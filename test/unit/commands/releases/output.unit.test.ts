import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/releases/output.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

type FakePlatform = {
  release: {
    info: sinon.SinonStub,
    list: sinon.SinonStub,
  }
  withHeaders: sinon.SinonStub,
}

function buildFakePlatform(): FakePlatform {
  const platform: FakePlatform = {
    release: {
      info: sinon.stub(),
      list: sinon.stub(),
    },
    withHeaders: sinon.stub(),
  }
  platform.withHeaders.returns(platform)
  return platform
}

describe('releases:output', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
  })

  it('warns if there is no output available', async function () {
    fakePlatform.release.info.resolves({version: 40})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])
    expect(stdout).to.equal('')
    expect(unwrap(stderr)).to.contain('Release v40 has no release output available.\n')
    expect(fakePlatform.release.info.calledOnceWithExactly('myapp', '10')).to.equal(true)
  })

  it('shows the output from a specific release', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    fakePlatform.release.info.resolves({output_stream_url: 'https://busl.test/streams/release.log', version: 40})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])
    busl.done()
    expect(stdout).to.equal('Release Output Content')
    expect(stderr).to.equal('')
    expect(fakePlatform.release.info.calledOnceWithExactly('myapp', '10')).to.equal(true)
  })

  it('shows the output from the latest release', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    fakePlatform.release.list.resolves([{output_stream_url: 'https://busl.test/streams/release.log', version: 40}])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    busl.done()
    expect(stdout).to.equal('Release Output Content')
    expect(stderr).to.equal('')
    expect(fakePlatform.release.list.calledOnceWithExactly('myapp')).to.equal(true)
  })

  it('has a missing output when the stream returns 404', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(404, '')
    fakePlatform.release.list.resolves([{output_stream_url: 'https://busl.test/streams/release.log', version: 40}])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    busl.done()
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Warning: Release command not started yet. Please try again in a few')
  })
})
