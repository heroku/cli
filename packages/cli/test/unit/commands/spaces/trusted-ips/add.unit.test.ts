import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('trusted-ips:add', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('adds a CIDR entry to the trusted IP ranges', async function () {
    api
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
        ],
      })
      .put('/spaces/my-space/inbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
          {action: 'allow', source: '127.0.0.1/20'},
        ],
      })
      .reply(200, {rules: []})
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        applied: true,
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
          {action: 'allow', source: '127.0.0.1/20'},
        ],
      })

    const {stdout} = await runCommand(['spaces:trusted-ips:add', '127.0.0.1/20', '--space', 'my-space', '--confirm', 'my-space'])

    expect(stdout).to.eq('Added 127.0.0.1/20 to trusted IP ranges on my-space\nTrusted IP rules are applied to this space.\n')
  })

  it('shows message when applied is false after add', async function () {
    api
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
        ],
      })
      .put('/spaces/my-space/inbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
          {action: 'allow', source: '127.0.0.1/20'},
        ],
      })
      .reply(200, {rules: []})
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        applied: false,
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
          {action: 'allow', source: '127.0.0.1/20'},
        ],
      })

    const {stdout} = await runCommand(['spaces:trusted-ips:add', '127.0.0.1/20', '--space', 'my-space', '--confirm', 'my-space'])

    expect(stdout).to.include('Added 127.0.0.1/20 to trusted IP ranges on my-space')
    expect(stdout).to.include('Trusted IP rules are not applied to this space. Update your Trusted IP list to trigger a re-application of the rules.')
  })

  it('shows nothing when applied is undefined (backward compatibility)', async function () {
    api
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
        ],
      })
      .put('/spaces/my-space/inbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
          {action: 'allow', source: '127.0.0.1/20'},
        ],
      })
      .reply(200, {rules: []})
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
          {action: 'allow', source: '127.0.0.1/20'},
        ],
      })

    const {stdout} = await runCommand(['spaces:trusted-ips:add', '127.0.0.1/20', '--space', 'my-space', '--confirm', 'my-space'])

    expect(stdout).to.eq('Added 127.0.0.1/20 to trusted IP ranges on my-space\n')
  })
})
