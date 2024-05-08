import {stderr} from 'stdout-stderr'
import {expect} from 'chai'
import Cmd from '../../../../../src/commands/spaces/vpn/destroy'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'

describe('spaces:vpn:destroy', function () {
  it('destroys a VPN Connection when name is specified', async function () {
    const api = nock('https://api.heroku.com')
      .delete('/spaces/my-space/vpn-connections/my-vpn-connection')
      .reply(202)

    await runCommand(Cmd, [
      'my-vpn-connection',
      '--space',
      'my-space',
      '--confirm',
      'my-vpn-connection',
    ])

    api.done()
    expect(stderr.output).to.eq(heredoc`
      Tearing down VPN Connection my-vpn-connection in space my-space...
      Tearing down VPN Connection my-vpn-connection in space my-space... done
    `)

    nock.cleanAll()
  })
})
