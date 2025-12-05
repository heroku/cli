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
        applied: true,
      })
    await runCommand(Cmd, ['--space', 'my-space'])
    expect(stdout.output).to.equal(heredoc(`
    === Trusted IP Ranges
    
    127.0.0.1/20
    Trusted IP rules are applied to this space.
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
        applied: true,
      })
    await runCommand(Cmd, ['--space', 'my-space'])
    expect(stdout.output).to.equal('=== my-space has no trusted IP ranges. All inbound web requests to dynos are blocked.\n\nTrusted IP rules are applied to this space.\n')
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
      applied: true,
    }

    const api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, ruleSet)
    await runCommand(Cmd, ['--space', 'my-space', '--json', 'true'])
    expect(JSON.parse(stdout.output)).to.eql(ruleSet)
    api.done()
  })

  it('shows message when applied is false', async function () {
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
        applied: false,
      })
    await runCommand(Cmd, ['--space', 'my-space'])
    expect(stdout.output).to.include('Trusted IP rules are not applied to this space. Update your Trusted IP list to trigger a re-application of the rules.')
    api.done()
  })

  it('shows nothing when applied is undefined (backward compatibility)', async function () {
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
})
