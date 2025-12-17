import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/releases/info.js'
import runCommand from '../../../helpers/runCommand.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

const d = new Date(2000, 1, 1)
describe('releases:info', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  const release = {
    addon_plan_names: ['addon1', 'addon2'],
    created_at: d,
    description: 'something changed',
    eligible_for_rollback: true,
    user: {
      email: 'foo@foo.com',
    },
    version: 10,
  }

  // eslint-disable-next-line perfectionist/sort-objects
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
      Change:                 something changed
      By:                     foo@foo.com
      Eligible for Rollback?: Yes
      When:                   ${d.toISOString()}

      === v10 Config vars

      FOO: foo
      BAR: bar
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
      Change:                 something changed
      By:                     foo@foo.com
      Eligible for Rollback?: Yes
      When:                   ${d.toISOString()}

      === v10 Config vars

      FOO=foo
      BAR=bar
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
      Change:                 something changed
      By:                     foo@foo.com
      Eligible for Rollback?: Yes
      When:                   ${d.toISOString()}

      === v10 Config vars

      FOO: foo
      BAR: bar
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
        created_at: d,
        description: 'something changed',
        eligible_for_rollback: false,
        status: 'failed',
        user: {email: 'foo@foo.com'},
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
      Change:                 something changed (release command failed)
      By:                     foo@foo.com
      Eligible for Rollback?: No
      When:                   ${d.toISOString()}

      === v10 Config vars

      FOO: foo
      BAR: bar
    `))
  })

  it('shows a pending release info', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, [{
        addon_plan_names: ['addon1', 'addon2'],
        created_at: d,
        description: 'something changed',
        eligible_for_rollback: false,
        status: 'pending',
        user: {email: 'foo@foo.com'},
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
      Add-ons:                addon1
                              addon2
      Change:                 something changed (release command executing)
      By:                     foo@foo.com
      Eligible for Rollback?: No
      When:                   ${d.toISOString()}

      === v10 Config vars

      FOO: foo
      BAR: bar
    `))
  })

  it("shows an expired release's info", async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, [{
        created_at: d,
        description: 'something changed',
        eligible_for_rollback: false,
        status: 'expired',
        user: {email: 'foo@foo.com'},
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
      Change:                 something changed (release expired)
      By:                     foo@foo.com
      Eligible for Rollback?: No
      When:                   ${d.toISOString()}

      === v10 Config vars

      FOO: foo
      BAR: bar
    `))
  })
})
