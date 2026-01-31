import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/spaces/vpn/connect.js'
import runCommand from '../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('spaces:vpn:connect', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('creates a VPN', async function () {
    api
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
    expect(stderr.output).to.contain('Creating VPN Connection in space ⬡ my-space... done\n')
    expect(ansis.strip(stderr.output)).to.contain(heredoc`
      Use heroku spaces:vpn:wait to track allocation.
    `)

    nock.cleanAll()
  })
})
