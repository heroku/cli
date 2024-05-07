import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import Cmd from '../../../../../src/commands/spaces/trusted-ips'
import runCommand from '../../../../helpers/runCommand'

const now = new Date()

describe('trusted-ips', function () {
  it('shows the trusted IP ranges', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        version: '1',
        default_action: 'allow',
        created_at: now,
        created_by: 'dickeyxxx',
        rules: [
          {source: '127.0.0.1/20', action: 'allow'},
        ],
      })
    await runCommand(Cmd, ['--space', 'my-space'])
    expect(stdout.output).to.equal(heredoc(`
    === Trusted IP Ranges
    
    127.0.0.1/20
    `))
    api.done()
  })

  it('shows the trusted IP ranges with blank rules', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        version: '1',
        default_action: 'allow',
        created_at: now,
        created_by: 'dickeyxxx',
        rules: [],
      })
    await runCommand(Cmd, ['--space', 'my-space'])
    expect(stdout.output).to.equal('=== my-space has no trusted IP ranges. All inbound web requests to dynos are blocked.\n\n')
    api.done()
  })

  it('shows the trusted IP ranges --json', async function () {
    const ruleSet = {
      version: '1',
      default_action: 'allow',
      created_at: now.toISOString(),
      created_by: 'dickeyxxx',
      rules: [
        {source: '127.0.0.1/20', action: 'allow'},
      ],
    }

    const api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, ruleSet)
    await runCommand(Cmd, ['--space', 'my-space', '--json', 'true'])
    expect(JSON.parse(stdout.output)).to.eql(ruleSet)
    api.done()
  })
})
