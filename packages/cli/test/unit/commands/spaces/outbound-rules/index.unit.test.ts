import {stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/outbound-rules/index'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import expectOutput from '../../../../helpers/utils/expectOutput'
import {expect} from 'chai'

describe('outbound-rules', function () {
  const now = new Date()

  it('shows the outbound rules', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        version: '1',
        created_at: now,
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })

    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expectOutput(stdout.output, heredoc(`
      === Outbound Rules
       Rule Number Destination  From Port To Port Protocol
       ─────────── ──────────── ───────── ─────── ────────
       1           128.0.0.1/20 80        80      tcp
    `))
  })

  it('shows the empty ruleset message when empty', async function () {
    nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        version: '1',
        default_action: 'allow',
        created_at: now,
        created_by: 'gandalf',
        rules: [],
      })

    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expectOutput(stdout.output, '=== my-space has no Outbound Rules. Your Dynos cannot communicate with hosts outside of my-space.\n')
  })

  it('shows the outbound rules via JSON when --json is passed', async function () {
    const ruleSet = {
      version: '1',
      default_action: 'allow',
      created_at: now.toISOString(),
      created_by: 'gandalf',
      rules: [
        {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
      ],
    }
    nock('https://api.heroku.com')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, ruleSet)

    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout.output)).to.eql(ruleSet)
  })
})
