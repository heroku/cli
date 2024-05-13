import * as nock from 'nock'
import {expect} from 'chai'
import {stderr, stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import {CLIError} from '@oclif/core/lib/errors'
import Cmd from '../../../../../src/commands/spaces/vpn/wait'
import runCommand from '../../../../helpers/runCommand'
import expectOutput from '../../../../helpers/utils/expectOutput'

describe('spaces:vpn:wait', function () {
  let api: nock.Scope

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('returns an error if the VPN status is updated to failed', async function () {
    let errorMessage = ''
    api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        space_cidr_block: '10.0.0.0/16',
        status: 'pending',
        status_message: 'supplied CIDR block already in use',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.196', // The one needed right now
            customer_ip: '52.44.146.197',
            pre_shared_key: 'apresharedkey1',
            status: 'UP',
            status_message: 'status message',
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.198',
            customer_ip: '52.44.146.199',
            pre_shared_key: 'apresharedkey2',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        space_cidr_block: '10.0.0.0/16',
        status: 'failed',
        status_message: 'supplied CIDR block already in use',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.196', // The one needed right now
            customer_ip: '52.44.146.197',
            pre_shared_key: 'apresharedkey1',
            status: 'UP',
            status_message: 'status message',
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.198',
            customer_ip: '52.44.146.199',
            pre_shared_key: 'apresharedkey2',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })

    try {
      await runCommand(Cmd, [
        '--space',
        'my-space',
        '--name',
        'vpn-connection-name-wait',
        '--interval',
        '0',
      ])
    } catch (error: any) {
      const {message} = error as CLIError
      errorMessage = message
    }

    expect(errorMessage).to.equal('supplied CIDR block already in use')
  })

  it('waits for VPN to allocate and then shows space config', async function () {
    api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        space_cidr_block: '10.0.0.0/16',
        status: 'pending',
        status_message: 'supplied CIDR block already in use',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.196', // The one needed right now
            customer_ip: '52.44.146.197',
            pre_shared_key: 'apresharedkey1',
            status: 'UP',
            status_message: 'status message',
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.198',
            customer_ip: '52.44.146.199',
            pre_shared_key: 'apresharedkey2',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        space_cidr_block: '10.0.0.0/16',
        status: 'active',
        status_message: '',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.196', // The one needed right now
            customer_ip: '52.44.146.197',
            pre_shared_key: 'apresharedkey1',
            status: 'UP',
            status_message: 'status message',
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.198',
            customer_ip: '52.44.146.199',
            pre_shared_key: 'apresharedkey2',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        space_cidr_block: '10.0.0.0/16',
        status: 'active',
        status_message: '',
        tunnels: [
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.196', // The one needed right now
            customer_ip: '52.44.146.197',
            pre_shared_key: 'apresharedkey1',
            status: 'UP',
            status_message: 'status message',
          },
          {
            last_status_change: '2016-10-25T22:09:05Z',
            ip: '52.44.146.198',
            customer_ip: '52.44.146.199',
            pre_shared_key: 'apresharedkey2',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })
    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--name',
      'vpn-connection-name-wait',
      '--interval',
      '0',
    ])

    expect(stderr.output).to.equal('Waiting for VPN Connection vpn-connection-name-wait to allocate......\nWaiting for VPN Connection vpn-connection-name-wait to allocate...... done\n')
    expectOutput(stdout.output, heredoc(`
    === vpn-connection-name-wait VPN Tunnels
     VPN Tunnel Customer Gateway VPN Gateway   Pre-shared Key Routable Subnets IKE Version
     ────────── ──────────────── ───────────── ────────────── ──────────────── ───────────
     Tunnel 1   52.44.146.197    52.44.146.196 apresharedkey1 10.0.0.0/16      1
     Tunnel 2   52.44.146.199    52.44.146.198 apresharedkey2 10.0.0.0/16      1
    `))
  })

  it('tells the user if the VPN has been allocated', async function () {
    api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-allocated')
      .reply(200, {
        id: '123456789012',
        name: 'vpn-connection-name-config',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        ike_version: 1,
        space_cidr_block: '10.0.0.0/16',
        status: 'active',
        status_message: '',
      })

    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--name',
      'vpn-connection-allocated',
      '--interval',
      '0',
    ])
    expectOutput(stderr.output, '')
    expectOutput(stdout.output, 'VPN has been allocated.\n')
  })
})
