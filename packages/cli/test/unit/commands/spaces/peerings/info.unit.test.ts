import {stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/peerings/info'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import expectOutput from '../../../../helpers/utils/expectOutput'
import {expect} from 'chai'
import * as Heroku from '@heroku-cli/schema'

describe('spaces:peering:info', function () {
  let peeringInfo: Heroku.PeeringInfo

  beforeEach(function () {
    peeringInfo = {
      aws_account_id: '012345678900',
      aws_region: 'us-west-2',
      vpc_id: 'vpc-1234568a',
      vpc_cidr: '10.0.0.0/16',
      space_cidr_blocks: ['10.0.128.0/20', '10.0.144.0/20'],
      unavailable_cidr_blocks: ['192.168.2.0/30']}
  })

  it('shows space peering info', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/peering-info')
      .reply(200, peeringInfo)

    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expectOutput(stdout.output, heredoc(`
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

    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout.output)).to.eql(peeringInfo)
  })
})
