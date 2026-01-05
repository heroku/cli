import {expect} from '@oclif/test'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'
import Cmd from '../../../../../src/commands/spaces/trusted-ips/remove.js'
import runCommand from '../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

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
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {source: '128.0.0.1/20', action: 'allow'},
        ],
        applied: true,
      })
    await runCommand(Cmd, ['127.0.0.1/20', '--space', 'my-space'])
    expect(stdout.output).to.eq(heredoc(`
    Removed 127.0.0.1/20 from trusted IP ranges on my-space
    Trusted IP rules are applied to this space.
    `))
    api.done()
  })

  it('shows message when applied is false after remove', async function () {
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
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {source: '128.0.0.1/20', action: 'allow'},
        ],
        applied: false,
      })
    await runCommand(Cmd, ['127.0.0.1/20', '--space', 'my-space'])
    expect(stdout.output).to.include('Removed 127.0.0.1/20 from trusted IP ranges on my-space')
    expect(stdout.output).to.include('Trusted IP rules are not applied to this space. Update your Trusted IP list to trigger a re-application of the rules.')
    api.done()
  })

  it('shows nothing when applied is undefined (backward compatibility)', async function () {
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
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {source: '128.0.0.1/20', action: 'allow'},
        ],
      })
    await runCommand(Cmd, ['127.0.0.1/20', '--space', 'my-space'])
    expect(stdout.output).to.eq(heredoc(`
    Removed 127.0.0.1/20 from trusted IP ranges on my-space
    `))
    api.done()
  })
})
