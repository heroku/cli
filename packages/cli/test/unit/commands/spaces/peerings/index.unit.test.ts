import {stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/peerings/index.js'
import runCommand from '../../../../helpers/runCommand.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'
import nock from 'nock'
import {expect} from 'chai'
import * as Heroku from '@heroku-cli/schema'

describe('spaces:peerings', function () {
  let peerings: Heroku.Peering[]

  beforeEach(function () {
    peerings = [{
      pcx_id: 'pcx-12345',
      type: 'heroku-managed',
      status: 'active',
      cidr_blocks: ['10.0.0.0/16'],
      aws_vpc_id: 'vpc-1234568a',
      aws_region: 'us-west-2',
      aws_account_id: '012345678910',
    }]
  })

  it('shows space peerings', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/peerings')
      .reply(200, peerings)

    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    expect(stdout.output).to.include('=== my-space Peerings')

    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('PCX ID Type CIDR Blocks Status VPC ID AWS Region AWS Account ID Expires')
    const expectedData = removeAllWhitespace('pcx-12345 heroku-managed 10.0.0.0/16 active vpc-1234568a us-west-2 012345678910')

    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expectedData)
  })

  it('shows peerings --json', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/peerings')
      .reply(200, peerings)

    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout.output)).to.eql(peerings)
  })
})
