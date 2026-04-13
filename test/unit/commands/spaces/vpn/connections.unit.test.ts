import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../../src/commands/spaces/vpn/connections.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

describe('spaces:vpn:connections', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  const space = {
    id: '123456789012',
    ike_version: 1,
    name: 'office',
    public_ip: '35.161.69.30',
    routable_cidrs: [
      '172.16.0.0/16',
    ],
    space_cidr_block: '10.0.0.0/16',
    status: 'active',
    status_message: 'Active',
    tunnels: [
      {
        customer_ip: '52.44.146.197',
        ip: '52.44.146.197',
        last_status_change: '2016-10-25T22:10:05Z',
        pre_shared_key: 'secret',
        status: 'UP',
        status_message: 'status message',
      },
      {
        customer_ip: '52.44.146.196',
        ip: '52.44.146.196',
        last_status_change: '2016-10-25T22:09:05Z',
        pre_shared_key: 'secret',
        status: 'UP',
        status_message: 'status message',
      },
    ],
  }

  it('displays no connection message if none exist', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces/my-space/vpn-connections')
      .reply(200, [])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    api.done()
    expect(stdout).to.eq('No VPN Connections have been created yet\n')
  })

  it('displays VPN Connections', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces/my-space/vpn-connections')
      .reply(200, [space])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    api.done()

    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('=== my-space VPN Connections'))
    expect(actual).to.include(removeAllWhitespace('Name   Status Tunnels'))
    expect(actual).to.include(removeAllWhitespace('office active UP/UP'))
  })

  it('displays VPN Connection ID when name is unavailable', async function () {
    const conn = {...space, name: ''}
    const api = nock('https://api.heroku.com')
      .get('/spaces/my-space/vpn-connections')
      .reply(200, [conn])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    api.done()

    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('=== my-space VPN Connections'))
    expect(actual).to.include(removeAllWhitespace('Name   Status Tunnels'))
    expect(actual).to.include(removeAllWhitespace('123456789012 active UP/UP'))
  })

  it('displays VPN Connections in JSON', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces/my-space/vpn-connections')
      .reply(200, [space])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])

    api.done()
    expect(JSON.parse(stdout)).to.eql([space])
  })
})
