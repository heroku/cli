import color from '@heroku-cli/color'
import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import runCommand from '../../../../helpers/runCommand'
import Cmd from '../../../../../src/commands/spaces/trusted-ips/add'

describe('trusted-ips:add', function () {
  it('adds a CIDR entry to the trusted IP ranges', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {source: '128.0.0.1/20', action: 'allow'},
        ],
      })
      .put('/spaces/my-space/inbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {source: '128.0.0.1/20', action: 'allow'},
          {source: '127.0.0.1/20', action: 'allow'},
        ],
      })
      .reply(200, {rules: []})
    await runCommand(Cmd, ['127.0.0.1/20', '--space', 'my-space', '--confirm', 'my-space'])
    expect(stdout.output).to.eq('Added 127.0.0.1/20 to trusted IP ranges on my-space\n')
    api.done()
  })
})
