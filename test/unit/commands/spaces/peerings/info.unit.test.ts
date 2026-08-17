import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {PeeringInfo} from '@heroku/types/3.sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/spaces/peerings/info.js'

const heredoc = tsheredoc.default

type FakePlatform = {
  peering: {info: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    peering: {info: sinon.stub()},
  }
}

describe('spaces:peering:info', function () {
  let fakePlatform: FakePlatform
  let peeringInfo: PeeringInfo

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    peeringInfo = {
      aws_account_id: '012345678900',
      aws_region: 'us-west-2',
      dyno_cidr_blocks: ['10.0.128.0/20', '10.0.144.0/20'],
      space_cidr_blocks: ['10.0.128.0/20', '10.0.144.0/20'],
      unavailable_cidr_blocks: ['192.168.2.0/30'],
      vpc_cidr: '10.0.0.0/16',
      vpc_id: 'vpc-1234568a',
    }
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows space peering info', async function () {
    fakePlatform.peering.info.resolves(peeringInfo)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expectOutput(stdout, heredoc(`
      === my-space Peering Info
      AWS Account ID:    ${peeringInfo.aws_account_id}
      AWS Region:        ${peeringInfo.aws_region}
      AWS VPC ID:        ${peeringInfo.vpc_id}
      AWS VPC CIDR:      ${peeringInfo.vpc_cidr}
      Space CIDRs:       10.0.128.0/20, 10.0.144.0/20
      Unavailable CIDRs: 192.168.2.0/30
    `))
    expect(fakePlatform.peering.info.calledOnceWithExactly('my-space')).to.equal(true)
  })

  it('shows peering:info --json', async function () {
    fakePlatform.peering.info.resolves(peeringInfo)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout)).to.eql(peeringInfo)
  })
})
