import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../../src/commands/spaces/vpn/destroy.js'

describe('spaces:vpn:destroy', function () {
  it('destroys a VPN Connection when name is specified', async function () {
    const api = nock('https://api.heroku.com')
      .delete('/spaces/my-space/vpn-connections/my-vpn-connection')
      .reply(202)

    const {stderr} = await runCommand(Cmd, [
      'my-vpn-connection',
      '--space',
      'my-space',
      '--confirm',
      'my-vpn-connection',
    ])
    api.done()
    expect(stderr).to.eq('Tearing down VPN Connection my-vpn-connection in space ⬡ my-space... done\n')

    nock.cleanAll()
  })
})
