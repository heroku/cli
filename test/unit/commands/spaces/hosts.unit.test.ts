import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/spaces/hosts.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  spaceHost: {list: sinon.SinonStub}
  withHeaders: sinon.SinonStub
}

function buildFakePlatform(): FakePlatform {
  const spaceHostStub = {list: sinon.stub()}
  const platform: FakePlatform = {
    spaceHost: spaceHostStub,
    withHeaders: sinon.stub(),
  }

  platform.withHeaders.returns({spaceHost: spaceHostStub})
  return platform
}

describe('spaces:hosts', function () {
  const hosts = [
    {
      allocated_at: '2020-05-28T04:15:59Z',
      available_capacity_percentage: 72,
      host_id: 'h-0f927460a59aac18e',
      released_at: null,
      state: 'available',
    }, {
      allocated_at: '2020-03-28T04:15:59Z',
      available_capacity_percentage: 0,
      host_id: 'h-0e927460a59aac18f',
      released_at: '2020-04-28T04:15:59Z',
      state: 'released',
    },
  ]
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('lists space hosts', async function () {
    fakePlatform.spaceHost.list.resolves(hosts)
    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    expect(fakePlatform.withHeaders.calledOnceWithExactly({Accept: 'application/vnd.heroku+json; version=3.dogwood'})).to.equal(true)
    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('=== my-space Hosts'))
    expect(actual).to.include(removeAllWhitespace('Host ID             State     Available Capacity Allocated At         Released At'))
    expect(actual).to.include(removeAllWhitespace('h-0f927460a59aac18e available 72%                2020-05-28T04:15:59Z'))
    expect(actual).to.include(removeAllWhitespace('h-0e927460a59aac18f released  0%                 2020-03-28T04:15:59Z 2020-04-28T04:15:59Z'))
  })

  it('shows hosts:info --json', async function () {
    fakePlatform.spaceHost.list.resolves(hosts)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout)).to.eql(hosts)
  })

  it('errors when space name is missing', async function () {
    const {error} = await runCommand(Cmd, [])
    expect(error).to.exist
    if (error) {
      expect(error.message).to.include('Error: Missing 1 required arg')
      expect(error.message).to.include('space')
    }
  })
})
