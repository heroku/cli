import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {LogDrain} from '@heroku/types/3.sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../../src/commands/spaces/drains/get.js'

type FakePlatform = {
  spaceLogDrain: {info: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    spaceLogDrain: {info: sinon.stub()},
  }
}

describe('spaces:drains:get', function () {
  const drain: LogDrain = {
    addon: null,
    app: {
      id: 'app-123',
      name: 'my-app',
    },
    created_at: '2016-03-23T18:31:50Z',
    id: '047f80cc-0470-4564-b0cb-e9ad7605314a',
    token: 'd.a55ecbe1-5513-4d19-91e4-58a08b419d19',
    updated_at: '2016-03-23T18:31:50Z',
    url: 'https://example.com',
  }
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows the log drain', async function () {
    fakePlatform.spaceLogDrain.info.resolves(drain)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expect(stdout).to.eq('https://example.com (d.a55ecbe1-5513-4d19-91e4-58a08b419d19)\n')
    expect(fakePlatform.spaceLogDrain.info.calledOnceWithExactly('my-space')).to.equal(true)
  })

  it('shows the log drain --json', async function () {
    fakePlatform.spaceLogDrain.info.resolves(drain)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout)).to.eql(drain)
  })
})
