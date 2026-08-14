import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {Peering} from '@heroku/types/3.sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../../src/commands/spaces/peerings/index.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  peering: {list: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    peering: {list: sinon.stub()},
  }
}

describe('spaces:peerings', function () {
  let fakePlatform: FakePlatform
  let peerings: Peering[]

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    peerings = [{
      aws_account_id: '012345678910',
      aws_region: 'us-west-2',
      aws_vpc_id: 'vpc-1234568a',
      cidr_block: '10.0.0.0/16',
      cidr_blocks: ['10.0.0.0/16'],
      expires: '',
      pcx_id: 'pcx-12345',
      status: 'active',
      type: 'heroku-managed',
    }]
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows space peerings', async function () {
    fakePlatform.peering.list.resolves(peerings)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expect(stdout).to.include('=== my-space Peerings')

    const actual = removeAllWhitespace(stdout)
    const expectedHeader = removeAllWhitespace('PCX ID Type CIDR Blocks Status VPC ID AWS Region AWS Account ID Expires')
    const expectedData = removeAllWhitespace('pcx-12345 heroku-managed 10.0.0.0/16 active vpc-1234568a us-west-2 012345678910')

    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expectedData)
    expect(fakePlatform.peering.list.calledOnceWithExactly('my-space')).to.equal(true)
  })

  it('shows peerings --json', async function () {
    fakePlatform.peering.list.resolves(peerings)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout)).to.eql(peerings)
  })

  it('errors when space name is missing', async function () {
    const {error} = await runCommand(Cmd, [])
    expect(error).to.exist
    if (error) {
      expect(error.message).to.include('space required')
    }
  })
})
