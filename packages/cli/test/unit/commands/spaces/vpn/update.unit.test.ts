import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/vpn/update'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import {expect} from 'chai'

describe('spaces:vpn:update', function () {
  it('updates VPN', async function () {
    const api = nock('https://api.heroku.com')
      .patch('/spaces/my-space/vpn-connections/office', {
        routable_cidrs: ['192.168.0.1/16', '192.168.0.2/16'],
      })
      .reply(201)

    await runCommand(Cmd, [
      'office',
      '--space',
      'my-space',
      '--cidrs',
      '192.168.0.1/16,192.168.0.2/16',
    ])

    api.done()
    expect(stderr.output).to.eq(heredoc`
      Updating VPN Connection in space my-space...
      Updating VPN Connection in space my-space... done
    `)

    nock.cleanAll()
  })
})
