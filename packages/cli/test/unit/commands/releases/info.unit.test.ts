import {stdout} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/releases/info'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'

const d = new Date(2000, 1, 1)
describe('releases:info', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  const release = {
    description: 'something changed',
    user: {
      email: 'foo@foo.com',
    }, created_at: d,
    version: 10,
    eligible_for_rollback: true,
    addon_plan_names: ['addon1', 'addon2'],
  }

  const configVars = {FOO: 'foo', BAR: 'bar'}

  it('shows most recent release info', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, [release])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout.output, heredoc(`
      === Release v10
      Add-ons:                addon1
                              addon2
      By:                     foo@foo.com
      Change:                 something changed
      Eligible for Rollback?: Yes
      When:                   ${d.toISOString()}

      === v10 Config vars

      BAR: bar
      FOO: foo
    `))
  })

  it('shows most recent release info config vars as shell', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, [release])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--shell',
    ])
    expectOutput(stdout.output, heredoc(`
      === Release v10
      Add-ons:                addon1
                              addon2
      By:                     foo@foo.com
      Change:                 something changed
      Eligible for Rollback?: Yes
      When:                   ${d.toISOString()}

      === v10 Config vars

      BAR=bar
      FOO=foo
    `))
  })

  it('shows release info by id', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases/10')
      .reply(200, release)
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])
    expectOutput(stdout.output, heredoc(`
      === Release v10
      Add-ons:                addon1
                              addon2
      By:                     foo@foo.com
      Change:                 something changed
      Eligible for Rollback?: Yes
      When:                   ${d.toISOString()}

      === v10 Config vars

      BAR: bar
      FOO: foo
    `))
  })

  it('shows recent release as json', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases/10')
      .reply(200, release)
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--json',
      'v10',
    ])
    expect(stdout.output).to.contain('"version": 10')
  })

  it('shows a failed release info', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, [{
        description: 'something changed',
        status: 'failed',
        eligible_for_rollback: false,
        user: {email: 'foo@foo.com'},
        created_at: d,
        version: 10,
      }])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout.output, heredoc(`
      === Release v10
      By:                     foo@foo.com
      Change:                 something changed (release command failed)
      Eligible for Rollback?: No
      When:                   ${d.toISOString()}

      === v10 Config vars

      BAR: bar
      FOO: foo
    `))
  })

  it('shows a pending release info', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, [{
        addon_plan_names: ['addon1', 'addon2'],
        description: 'something changed',
        status: 'pending',
        user: {email: 'foo@foo.com'},
        version: 10,
        eligible_for_rollback: false,
        created_at: d,
      }])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout.output, heredoc(`
      === Release v10
      Add-ons:                addon1
                              addon2
      By:                     foo@foo.com
      Change:                 something changed (release command executing)
      Eligible for Rollback?: No
      When:                   ${d.toISOString()}

      === v10 Config vars

      BAR: bar
      FOO: foo
    `))
  })

  it("shows an expired release's info", async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, [{
        description: 'something changed',
        status: 'expired',
        eligible_for_rollback: false,
        user: {email: 'foo@foo.com'},
        created_at: d,
        version: 10,
      }])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout.output, heredoc(`
      === Release v10
      By:                     foo@foo.com
      Change:                 something changed (release expired)
      Eligible for Rollback?: No
      When:                   ${d.toISOString()}

      === v10 Config vars

      BAR: bar
      FOO: foo
    `))
  })
})
