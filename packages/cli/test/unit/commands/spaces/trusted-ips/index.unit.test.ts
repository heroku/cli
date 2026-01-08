import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

const now = new Date()

describe('trusted-ips', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('shows the trusted IP ranges', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        applied: true,
        created_at: now,
        created_by: 'dickeyxxx',
        default_action: 'allow',
        rules: [
          {action: 'allow', source: '127.0.0.1/20'},
        ],
        version: '1',
      })

    const {stdout} = await runCommand(['spaces:trusted-ips', '--space', 'my-space'])

    expect(stdout).to.equal(heredoc(`
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
        applied: true,
        created_at: now,
        created_by: 'dickeyxxx',
        default_action: 'allow',
        rules: [],
        version: '1',
      })

    const {stdout} = await runCommand(['spaces:trusted-ips', '--space', 'my-space'])

    expect(stdout).to.equal('=== my-space has no trusted IP ranges. All inbound web requests to dynos are blocked.\n\nTrusted IP rules are applied to this space.\n')
    api.done()
  })

  it('shows the trusted IP ranges --json', async function () {
    const ruleSet = {
      applied: true,
      created_at: now.toISOString(),
      created_by: 'dickeyxxx',
      default_action: 'allow',
      rules: [
        {action: 'allow', source: '127.0.0.1/20'},
      ],
      version: '1',
    }

    const api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, ruleSet)

    const {stdout} = await runCommand(['spaces:trusted-ips', '--space', 'my-space', '--json', 'true'])

    expect(JSON.parse(stdout)).to.eql(ruleSet)
    api.done()
  })

  it('shows message when applied is false', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        applied: false,
        created_at: now,
        created_by: 'dickeyxxx',
        default_action: 'allow',
        rules: [
          {action: 'allow', source: '127.0.0.1/20'},
        ],
        version: '1',
      })

    const {stdout} = await runCommand(['spaces:trusted-ips', '--space', 'my-space'])

    expect(stdout).to.include('Trusted IP rules are not applied to this space. Update your Trusted IP list to trigger a re-application of the rules.')
    api.done()
  })

  it('shows nothing when applied is undefined (backward compatibility)', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_at: now,
        created_by: 'dickeyxxx',
        default_action: 'allow',
        rules: [
          {action: 'allow', source: '127.0.0.1/20'},
        ],
        version: '1',
      })

    const {stdout} = await runCommand(['spaces:trusted-ips', '--space', 'my-space'])

    expect(stdout).to.equal(heredoc(`
    === Trusted IP Ranges

    127.0.0.1/20
    `))
    api.done()
  })
})
