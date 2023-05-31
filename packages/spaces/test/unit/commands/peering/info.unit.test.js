'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmd = require('../../../../commands/peering/info')
let expect = require('chai').expect
let cli = require('heroku-cli-util')
let info = {
  aws_account_id: '012345678900',
  aws_region: 'us-west-2',
  vpc_id: 'vpc-1234568a',
  vpc_cidr: '10.0.0.0/16',
  space_cidr_blocks: ['10.0.128.0/20', '10.0.144.0/20'],
  unavailable_cidr_blocks: ['192.168.2.0/30']}

describe('spaces:peering-info', function () {
  beforeEach(() => cli.mockConsole())

  it('shows space peering info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/peering-info')
      .reply(200,
        info,
      )
    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== my-space Peering Info
AWS Account ID:    012345678900
AWS Region:        us-west-2
AWS VPC ID:        vpc-1234568a
AWS VPC CIDR:      10.0.0.0/16
Space CIDRs:       10.0.128.0/20, 10.0.144.0/20
Unavailable CIDRs: 192.168.2.0/30
`))
      .then(() => api.done())
  })

  it('shows peering:info --json', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/peering-info')
      .reply(200, info)

    return cmd.run({flags: {space: 'my-space', json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(info))
      .then(() => api.done())
  })
})
