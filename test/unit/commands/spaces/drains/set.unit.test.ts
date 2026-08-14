import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {LogDrain} from '@heroku/types/3.sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Set from '../../../../../src/commands/spaces/drains/set.js'

type FakePlatform = {
  spaceLogDrain: {update: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    spaceLogDrain: {update: sinon.stub()},
  }
}

describe('spaces:drains:set', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('sets the log drain', async function () {
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

    fakePlatform.spaceLogDrain.update.resolves(drain)

    const {stdout} = await runCommand(Set, ['https://example.com', '--space', 'my-space'])

    expect(stdout).to.equal('Successfully set drain https://example.com for ⬡ my-space.\n')
    expect(fakePlatform.spaceLogDrain.update.calledOnceWithExactly('my-space', {url: 'https://example.com'})).to.equal(true)
  })
})
