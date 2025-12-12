import {stdout} from 'stdout-stderr'
import {displayPeeringInfo, displayPeeringsAsJSON, displayPeerings} from '../../../../src/lib/spaces/peering.js'
import {Peering, PeeringInfo} from '@heroku-cli/schema'
import tsheredoc from 'tsheredoc'
import expectOutput from '../../../helpers/utils/expectOutput.js'
import {expect} from 'chai'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc.default

const peerings: Peering[] = [
  {
    pcx_id: 'pcx-12345',
    type: 'heroku-managed',
    status: 'active',
    cidr_blocks: ['10.0.0.0/16'],
    aws_vpc_id: 'vpc-1234568a',
    aws_region: 'us-west-2',
    aws_account_id: '012345678910',
  },
  {
    pcx_id: 'pcx-12346',
    type: 'heroku-managed',
    status: 'active',
    cidr_blocks: ['10.0.0.0/16'],
    aws_vpc_id: 'vpc-1234568b',
    aws_region: 'us-west-2',
    aws_account_id: '012345678911',
  }
]

describe('displayPeeringInfo', function () {
  const peeringInfo: PeeringInfo = {
    aws_account_id: '012345678900',
    aws_region: 'us-west-2',
    vpc_id: 'vpc-1234568a',
    vpc_cidr: '10.0.0.0/16',
    space_cidr_blocks: ['10.0.128.0/20', '10.0.144.0/20'],
    unavailable_cidr_blocks: ['192.168.2.0/30']
  }

  it('outputs peering info', function () {
    stdout.start()
    displayPeeringInfo('my-space', peeringInfo)
    stdout.stop()

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
})

describe('displayPeeringsAsJSON', function () {
  it('outputs peerings in JSON format', function () {
    stdout.start()
    displayPeeringsAsJSON(peerings)
    stdout.stop()
    expect(JSON.parse(stdout.output)).to.eql(peerings)
  })
})

describe('displayPeerings', function () {
  it('outputs peerings in styled format', function () {
    stdout.start()
    displayPeerings('my-space', peerings)
    stdout.stop()

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== my-space Peerings'))
    expect(actual).to.include(removeAllWhitespace('PCX ID Type CIDR Blocks Status VPC ID AWS Region AWS Account ID Expires'))
    expect(actual).to.include(removeAllWhitespace('pcx-12345 heroku-managed 10.0.0.0/16 active vpc-1234568a us-west-2 012345678910'))
    expect(actual).to.include(removeAllWhitespace('pcx-12346 heroku-managed 10.0.0.0/16 active vpc-1234568b us-west-2 012345678911'))
  })
})
