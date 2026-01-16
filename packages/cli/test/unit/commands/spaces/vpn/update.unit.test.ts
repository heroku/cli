import {expect} from 'chai'
import nock from 'nock'
import {stderr} from 'stdout-stderr'

import Cmd from '../../../../../src/commands/spaces/vpn/update.js'
import runCommand from '../../../../helpers/runCommand.js'

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
    expect(stderr.output).to.eq('Updating VPN Connection in space ⬡ my-space... done\n')

    nock.cleanAll()
  })
})
