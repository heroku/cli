import {stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/vpn/connections'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import heredoc from 'tsheredoc'

describe('spaces:vpn:connections', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  const space = {
    id: '123456789012',
    name: 'office',
    public_ip: '35.161.69.30',
    routable_cidrs: [
      '172.16.0.0/16',
    ],
    ike_version: 1,
    space_cidr_block: '10.0.0.0/16',
    status: 'active',
    status_message: 'Active',
    tunnels: [
      {
        last_status_change: '2016-10-25T22:10:05Z',
        ip: '52.44.146.197',
        customer_ip: '52.44.146.197',
        pre_shared_key: 'secret',
        status: 'UP',
        status_message: 'status message',
      },
      {
        last_status_change: '2016-10-25T22:09:05Z',
        ip: '52.44.146.196',
        customer_ip: '52.44.146.196',
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

    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    api.done()
    expect(stdout.output).to.eq('No VPN Connections have been created yet\n')
  })

  it('displays VPN Connections', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces/my-space/vpn-connections')
      .reply(200, [space])

    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    api.done()
    expect(stdout.output).to.eq(heredoc`
      === my-space VPN Connections

       Name   Status Tunnels 
       ────── ────── ─────── 
       office active UP/UP   
    `)
  })

  it('displays VPN Connection ID when name is unavailable', async function () {
    const conn = {...space, name: ''}
    const api = nock('https://api.heroku.com')
      .get('/spaces/my-space/vpn-connections')
      .reply(200, [conn])

    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    api.done()
    expect(stdout.output).to.eq(heredoc`
      === my-space VPN Connections

       Name         Status Tunnels 
       ──────────── ────── ─────── 
       123456789012 active UP/UP   
    `)
  })

  it('displays VPN Connections in JSON', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces/my-space/vpn-connections')
      .reply(200, [space])

    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])

    api.done()
    expect(JSON.parse(stdout.output)).to.eql([space])
  })
})
