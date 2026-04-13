import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/spaces/vpn/wait.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc.default
type CLIError = Errors.CLIError

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
        ike_version: 1,
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        space_cidr_block: '10.0.0.0/16',
        status: 'pending',
        status_message: 'supplied CIDR block already in use',
        tunnels: [
          {
            customer_ip: '52.44.146.197',
            ip: '52.44.146.196', // The one needed right now
            last_status_change: '2016-10-25T22:09:05Z',
            pre_shared_key: 'apresharedkey1',
            status: 'UP',
            status_message: 'status message',
          },
          {
            customer_ip: '52.44.146.199',
            ip: '52.44.146.198',
            last_status_change: '2016-10-25T22:09:05Z',
            pre_shared_key: 'apresharedkey2',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        ike_version: 1,
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        space_cidr_block: '10.0.0.0/16',
        status: 'failed',
        status_message: 'supplied CIDR block already in use',
        tunnels: [
          {
            customer_ip: '52.44.146.197',
            ip: '52.44.146.196', // The one needed right now
            last_status_change: '2016-10-25T22:09:05Z',
            pre_shared_key: 'apresharedkey1',
            status: 'UP',
            status_message: 'status message',
          },
          {
            customer_ip: '52.44.146.199',
            ip: '52.44.146.198',
            last_status_change: '2016-10-25T22:09:05Z',
            pre_shared_key: 'apresharedkey2',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })

    const {error} = await runCommand(Cmd, [
      'vpn-connection-name-wait',
      '--space',
      'my-space',
      '--interval',
      '0',
    ])
    errorMessage = (error as CLIError)?.message || ''

    expect(errorMessage).to.equal('supplied CIDR block already in use')
  })

  it('waits for VPN to allocate and then shows space config', async function () {
    api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        ike_version: 1,
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        space_cidr_block: '10.0.0.0/16',
        status: 'pending',
        status_message: 'supplied CIDR block already in use',
        tunnels: [
          {
            customer_ip: '52.44.146.197',
            ip: '52.44.146.196', // The one needed right now
            last_status_change: '2016-10-25T22:09:05Z',
            pre_shared_key: 'apresharedkey1',
            status: 'UP',
            status_message: 'status message',
          },
          {
            customer_ip: '52.44.146.199',
            ip: '52.44.146.198',
            last_status_change: '2016-10-25T22:09:05Z',
            pre_shared_key: 'apresharedkey2',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        ike_version: 1,
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        space_cidr_block: '10.0.0.0/16',
        status: 'active',
        status_message: '',
        tunnels: [
          {
            customer_ip: '52.44.146.197',
            ip: '52.44.146.196', // The one needed right now
            last_status_change: '2016-10-25T22:09:05Z',
            pre_shared_key: 'apresharedkey1',
            status: 'UP',
            status_message: 'status message',
          },
          {
            customer_ip: '52.44.146.199',
            ip: '52.44.146.198',
            last_status_change: '2016-10-25T22:09:05Z',
            pre_shared_key: 'apresharedkey2',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-wait')
      .reply(200, {
        id: '123456789012',
        ike_version: 1,
        name: 'vpn-connection-name-wait',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        space_cidr_block: '10.0.0.0/16',
        status: 'active',
        status_message: '',
        tunnels: [
          {
            customer_ip: '52.44.146.197',
            ip: '52.44.146.196', // The one needed right now
            last_status_change: '2016-10-25T22:09:05Z',
            pre_shared_key: 'apresharedkey1',
            status: 'UP',
            status_message: 'status message',
          },
          {
            customer_ip: '52.44.146.199',
            ip: '52.44.146.198',
            last_status_change: '2016-10-25T22:09:05Z',
            pre_shared_key: 'apresharedkey2',
            status: 'UP',
            status_message: 'status message',
          },
        ],
      })
    const {stderr, stdout} = await runCommand(Cmd, [
      'vpn-connection-name-wait',
      '--space',
      'my-space',
      '--interval',
      '0',
    ])
    expect(stderr).to.equal('Waiting for VPN Connection vpn-connection-name-wait to allocate...... done\n')

    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('=== vpn-connection-name-wait VPN Tunnels'))
    expect(actual).to.include(removeAllWhitespace('VPN Tunnel Customer Gateway VPN Gateway   Pre-shared Key Routable Subnets IKE Version'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 1   52.44.146.197    52.44.146.196 apresharedkey1 10.0.0.0/16      1'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 2   52.44.146.199    52.44.146.198 apresharedkey2 10.0.0.0/16      1'))
  })

  it('tells the user if the VPN has been allocated', async function () {
    api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/vpn-connections/vpn-connection-allocated')
      .reply(200, {
        id: '123456789012',
        ike_version: 1,
        name: 'vpn-connection-name-config',
        public_ip: '35.161.69.30',
        routable_cidrs: ['172.16.0.0/16'],
        space_cidr_block: '10.0.0.0/16',
        status: 'active',
        status_message: '',
      })

    const {stderr, stdout} = await runCommand(Cmd, [
      'vpn-connection-allocated',
      '--space',
      'my-space',
      '--interval',
      '0',
    ])
    expectOutput(stderr, '')
    expectOutput(stdout, 'VPN has been allocated.\n')
  })
})
