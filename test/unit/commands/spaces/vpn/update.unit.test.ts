import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../../src/commands/spaces/vpn/update.js'

describe('spaces:vpn:update', function () {
  it('updates VPN', async function () {
    const api = nock('https://api.heroku.com')
      .patch('/spaces/my-space/vpn-connections/office', {
        routable_cidrs: ['192.168.0.1/16', '192.168.0.2/16'],
      })
      .reply(201)

    const {stderr} = await runCommand(Cmd, [
      'office',
      '--space',
      'my-space',
      '--cidrs',
      '192.168.0.1/16,192.168.0.2/16',
    ])
    api.done()
    expect(stderr).to.eq('Updating VPN Connection in space ⬡ my-space... done\n')

    nock.cleanAll()
  })
})
