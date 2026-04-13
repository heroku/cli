import * as Heroku from '@heroku-cli/schema'
import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../../src/commands/spaces/peerings/index.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

describe('spaces:peerings', function () {
  let peerings: Heroku.Peering[]

  beforeEach(function () {
    peerings = [{
      aws_account_id: '012345678910',
      aws_region: 'us-west-2',
      aws_vpc_id: 'vpc-1234568a',
      cidr_blocks: ['10.0.0.0/16'],
      pcx_id: 'pcx-12345',
      status: 'active',
      type: 'heroku-managed',
    }]
  })

  it('shows space peerings', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/peerings')
      .reply(200, peerings)

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
  })

  it('shows peerings --json', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/peerings')
      .reply(200, peerings)

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
