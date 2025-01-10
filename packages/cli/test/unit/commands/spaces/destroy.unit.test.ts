import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/spaces/destroy'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import heredoc from 'tsheredoc'
import {ux} from '@oclif/core'
import * as sinon from 'sinon'
describe('spaces:destroy', function () {
  const now = new Date()

  beforeEach(function () {
    sinon.stub(ux, 'prompt').resolves('my-space')
  })

  afterEach(function () {
    nock.cleanAll()
    sinon.restore()
  })

  it('destroys a space', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces/my-space')
      .reply(200, {name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, state: 'allocated', created_at: now})
      .get('/spaces/my-space/nat')
      .reply(200, {state: 'enabled', sources: ['1.1.1.1', '2.2.2.2']})
      .delete('/spaces/my-space')
      .reply(200)

    await runCommand(Cmd, ['--space', 'my-space'])
    api.done()

    expect(stderr.output).to.eq(heredoc`     ›   Warning: Destructive Action
     ›   This command will destroy the space my-space
     ›   === WARNING: Outbound IPs Will Be Reused
     ›   ⚠️ The following outbound IPs (IPv4 and IPv6) will become available for 
     ›   reuse:
     ›   1.1.1.1, 2.2.2.2
     ›
     ›   Please update the following configurations:
     ›   = IP allowlists
     ›   = Firewall rules
     ›   = Security group configurations
     ›   = Network ACLs
     ›
     ›   Ensure all IPv4 and IPv6 addresses are removed from your security 
     ›   configurations.
     ›
     ›
    
    Destroying space my-space...
    Destroying space my-space... done
    `)
  })
})
