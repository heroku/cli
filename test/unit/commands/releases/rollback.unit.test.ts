import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/releases/rollback.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

type FakePlatform = {
  release: {
    info: sinon.SinonStub,
    list: sinon.SinonStub,
    rollback: sinon.SinonStub,
  }
  withHeaders: sinon.SinonStub,
}

function buildFakePlatform(): FakePlatform {
  const platform: FakePlatform = {
    release: {
      info: sinon.stub(),
      list: sinon.stub(),
      rollback: sinon.stub(),
    },
    withHeaders: sinon.stub(),
  }
  platform.withHeaders.returns(platform)
  return platform
}

describe('releases:rollback', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
  })

  it('rolls back the release', async function () {
    fakePlatform.release.info.resolves({id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', version: 40})
    fakePlatform.release.rollback.resolves({})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])

    expect(fakePlatform.release.info.calledOnceWithExactly('myapp', '10')).to.equal(true)
    expect(fakePlatform.release.rollback.calledOnceWithExactly('myapp', {release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5'})).to.equal(true)
  })

  it('rolls back to the latest release', async function () {
    fakePlatform.release.list.resolves([{
      eligible_for_rollback: true, id: 'current_release', status: 'succeeded', version: 41,
    }, {
      eligible_for_rollback: true, id: 'previous_release', status: 'succeeded', version: 40,
    }])
    fakePlatform.release.rollback.resolves({})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(fakePlatform.release.list.calledOnceWithExactly('myapp')).to.equal(true)
    expect(fakePlatform.release.rollback.calledOnceWithExactly('myapp', {release: 'previous_release'})).to.equal(true)
  })

  it('does not roll back to a failed release', async function () {
    fakePlatform.release.list.resolves([{
      eligible_for_rollback: true, id: 'current_release', status: 'succeeded', version: 41,
    }, {
      eligible_for_rollback: false, id: 'failed_release', status: 'failed', version: 40,
    }, {
      eligible_for_rollback: true, id: 'succeeded_release', status: 'succeeded', version: 39,
    }])
    fakePlatform.release.rollback.resolves({})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(fakePlatform.release.rollback.calledOnceWithExactly('myapp', {release: 'succeeded_release'})).to.equal(true)
  })

  it('streams the release command output', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    fakePlatform.release.info.resolves({id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', version: 40})
    fakePlatform.release.rollback.resolves({output_stream_url: 'https://busl.test/streams/release.log', version: 40})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])
    busl.done()

    const stderr_output = unwrap(stderr)
    expect(stderr_output).to.contain('Rolling back ⬢ myapp to v40... done, v40')
    expect(stderr_output).to.contain("Rollback affects code and config vars; it doesn't add or remove addons.")
    expect(stderr_output).to.contain('To undo, run: heroku rollback v39')
    expect(stdout).to.equal('Running release command...\nRelease Output Content')
  })

  it('has a missing output when the stream returns 404', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(404, '')
    fakePlatform.release.info.resolves({id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', version: 40})
    fakePlatform.release.rollback.resolves({output_stream_url: 'https://busl.test/streams/release.log', version: 40})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])
    busl.done()

    expect(stdout).to.equal('Running release command...\n')
    expect(unwrap(stderr)).to.contain('Release command starting. Use `heroku releases:output` to view the log.')
  })
})
