'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmd = require('../../../../commands/peering/index')
let expect = require('chai').expect
let cli = require('@heroku/heroku-cli-util')
let peers = [
  {
    type: 'heroku',
    pcx_id: '******',
    cidr_block: '10.1.0.0/16',
    cidr_blocks: ['10.1.0.0/16'],
    status: 'active',
    aws_vpc_id: '******',
    aws_region: '******',
    aws_account_id: '******',
    expires: '',
  },
  {
    type: 'external',
    pcx_id: 'pcx-123456789012',
    cidr_block: '10.2.0.0/16',
    cidr_blocks: ['10.2.0.0/16', '10.3.0.0/16'],
    status: 'active',
    aws_vpc_id: 'vpc-12345678',
    aws_region: 'us-east-1',
    aws_account_id: '012345678901',
    expires: '',
  },
  {
    type: 'unknown',
    pcx_id: 'pcx-0987654321098',
    cidr_block: '10.4.0.0/16',
    cidr_blocks: ['10.4.0.0/16'],
    status: 'pending-acceptance',
    aws_vpc_id: 'vpc-87654321',
    aws_region: 'us-west-1',
    aws_account_id: '012345678901',
    expires: '',
  },
  {
    type: 'unknown',
    pcx_id: 'pcx-abcdefg',
    cidr_block: '10.5.0.0/16',
    cidr_blocks: ['10.5.0.0/16'],
    status: 'failed',
    aws_vpc_id: 'vpc-665544332',
    aws_region: 'us-east-2',
    aws_account_id: '012345678901',
    expires: '',
  },
]

describe('spaces:peerings', function () {
  beforeEach(() => cli.mockConsole())

  it('shows space peering info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/peerings')
      .reply(200,
        peers,
      )
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space Peerings
PCX ID             Type      CIDR Blocks               Status              VPC ID         AWS Region  AWS Account ID  Expires
─────────────────  ────────  ────────────────────────  ──────────────────  ─────────────  ──────────  ──────────────  ───────
******             heroku    10.1.0.0/16               active              ******         ******      ******
pcx-123456789012   external  10.2.0.0/16, 10.3.0.0/16  active              vpc-12345678   us-east-1   012345678901
pcx-0987654321098  unknown   10.4.0.0/16               pending-acceptance  vpc-87654321   us-west-1   012345678901
pcx-abcdefg        unknown   10.5.0.0/16               failed              vpc-665544332  us-east-2   012345678901
`))
      .then(() => api.done())
  })

  it('shows peering:info --json', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/peerings')
      .reply(200, peers)

    return cmd.run({flags: {space: 'my-space', json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(peers))
      .then(() => api.done())
  })
})
