import * as Heroku from '@heroku-cli/schema'
import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/spaces/peerings/info.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

describe('spaces:peering:info', function () {
  let peeringInfo: Heroku.PeeringInfo

  beforeEach(function () {
    peeringInfo = {
      aws_account_id: '012345678900',
      aws_region: 'us-west-2',
      space_cidr_blocks: ['10.0.128.0/20', '10.0.144.0/20'],
      unavailable_cidr_blocks: ['192.168.2.0/30'],
      vpc_cidr: '10.0.0.0/16',
      vpc_id: 'vpc-1234568a',
    }
  })

  it('shows space peering info', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/peering-info')
      .reply(200, peeringInfo)

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
  })

  it('shows peering:info --json', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/peering-info')
      .reply(200, peeringInfo)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout)).to.eql(peeringInfo)
  })
})
