import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/vpn/connect'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import {expect} from 'chai'
import stripAnsi = require('strip-ansi')

describe('spaces:vpn:connect', function () {
  it('creates a VPN', async function () {
    const api = nock('https://api.heroku.com')
      .post('/spaces/my-space/vpn-connections', {
        name: 'office',
        public_ip: '192.168.0.1',
        routable_cidrs: ['192.168.0.1/16', '192.168.0.2/16'],
      })
      .reply(201)

    await runCommand(Cmd, [
      'office',
      '--space',
      'my-space',
      '--ip',
      '192.168.0.1',
      '--cidrs',
      '192.168.0.1/16,192.168.0.2/16',
    ])

    api.done()
    expect(stderr.output).to.contain(heredoc`
      Creating VPN Connection in space my-space...
      Creating VPN Connection in space my-space... done
    `)
    expect(stripAnsi(stderr.output)).to.contain(heredoc`
      Use heroku spaces:vpn:wait to track allocation.
    `)

    nock.cleanAll()
  })
})
