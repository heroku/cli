import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import runCommand from '../../../../helpers/runCommand'
import Cmd from '../../../../../src/commands/spaces/outbound-rules/remove'

describe('outbound-rules:remove', function () {
  it('removes a rule entry from the outbound rules', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.0.1/20', from_port: 443, to_port: 443, protocol: 'udp'},
        ],
      },
      )
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })
      .reply(200, {rules: []})
    await runCommand(Cmd, ['2', '--space', 'my-space', '--confirm', 'my-space'])
    api.done()
    expect(stdout.output).to.eql('Removed Rule 2 from Outbound Rules on my-space\n')
  })
})
