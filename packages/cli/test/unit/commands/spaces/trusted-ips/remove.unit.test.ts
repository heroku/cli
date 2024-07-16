import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import Cmd from '../../../../../src/commands/spaces/trusted-ips/remove'
import runCommand from '../../../../helpers/runCommand'

describe('trusted-ips:remove', function () {
  it('removes a CIDR entry from the trusted IP ranges', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {source: '128.0.0.1/20', action: 'allow'},
          {source: '127.0.0.1/20', action: 'allow'},
        ],
      },
      )
      .put('/spaces/my-space/inbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {source: '128.0.0.1/20', action: 'allow'},
        ],
      })
      .reply(200, {rules: []})
    await runCommand(Cmd, ['127.0.0.1/20', '--space', 'my-space'])
    expect(stdout.output).to.eq(heredoc(`
    Removed 127.0.0.1/20 from trusted IP ranges on my-space
    `))
    api.done()
  })
})
