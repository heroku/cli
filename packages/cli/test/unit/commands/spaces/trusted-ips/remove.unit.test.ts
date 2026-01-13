import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

describe('trusted-ips:remove', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('removes a CIDR entry from the trusted IP ranges', async function () {
    api
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
          {action: 'allow', source: '127.0.0.1/20'},
        ],
      },
      )
      .put('/spaces/my-space/inbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
        ],
      })
      .reply(200, {rules: []})
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        applied: true,
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
        ],
      })

    const {stdout} = await runCommand(['spaces:trusted-ips:remove', '127.0.0.1/20', '--space', 'my-space'])

    expect(stdout).to.eq(heredoc(`
    Removed 127.0.0.1/20 from trusted IP ranges on my-space
    Trusted IP rules are applied to this space.
    `))
  })

  it('shows message when applied is false after remove', async function () {
    api
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
          {action: 'allow', source: '127.0.0.1/20'},
        ],
      },
      )
      .put('/spaces/my-space/inbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
        ],
      })
      .reply(200, {rules: []})
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        applied: false,
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
        ],
      })

    const {stdout} = await runCommand(['spaces:trusted-ips:remove', '127.0.0.1/20', '--space', 'my-space'])

    expect(stdout).to.include('Removed 127.0.0.1/20 from trusted IP ranges on my-space')
    expect(stdout).to.include('Trusted IP rules are not applied to this space. Update your Trusted IP list to trigger a re-application of the rules.')
  })

  it('shows nothing when applied is undefined (backward compatibility)', async function () {
    api
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
          {action: 'allow', source: '127.0.0.1/20'},
        ],
      },
      )
      .put('/spaces/my-space/inbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
        ],
      })
      .reply(200, {rules: []})
      .get('/spaces/my-space/inbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {action: 'allow', source: '128.0.0.1/20'},
        ],
      })

    const {stdout} = await runCommand(['spaces:trusted-ips:remove', '127.0.0.1/20', '--space', 'my-space'])

    expect(stdout).to.eq(heredoc(`
    Removed 127.0.0.1/20 from trusted IP ranges on my-space
    `))
  })
})
