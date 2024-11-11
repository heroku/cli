import {stdout} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/releases/info'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'

const d = new Date(2000, 1, 1)
describe('releases:info', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  const release = {
    description: 'something changed',
    user: {
      email: 'foo@foo.com',
    }, created_at: d, version: 10, addon_plan_names: ['addon1', 'addon2'],
  }

  const configVars = {FOO: 'foo', BAR: 'bar'}

  it('shows most recent release info', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [release])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    return runCommand(Cmd, [
      '--app',
      'myapp',
    ])
      .then(() => expect(stdout.output).to.equal(`=== Release v10\n\nAdd-ons: addon1\n         addon2\nBy:      foo@foo.com\nChange:  something changed\nWhen:    ${d.toISOString()}\n\n=== v10 Config vars\n\nBAR: bar\nFOO: foo\n`))
      .then(() => api.done())
  })

  it('shows most recent release info config vars as shell', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [release])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    return runCommand(Cmd, [
      '--app',
      'myapp',
      '--shell',
    ])
      .then(() => expect(stdout.output).to.equal(`=== Release v10\n\nAdd-ons: addon1\n         addon2\nBy:      foo@foo.com\nChange:  something changed\nWhen:    ${d.toISOString()}\n\n=== v10 Config vars\n\nFOO=foo\nBAR=bar\n`))
      .then(() => api.done())
  })

  it('shows release info by id', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, release)
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    return runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])
      .then(() => expect(stdout.output).to.equal(`=== Release v10\n\nAdd-ons: addon1\n         addon2\nBy:      foo@foo.com\nChange:  something changed\nWhen:    ${d.toISOString()}\n\n=== v10 Config vars\n\nBAR: bar\nFOO: foo\n`))
      .then(() => api.done())
  })

  it('shows recent release as json', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, release)
    return runCommand(Cmd, [
      '--app',
      'myapp',
      '--json',
      'v10',
    ])
      .then(() => expect(stdout.output).to.contain('"version": 10'))
      .then(() => api.done())
  })

  it('shows a failed release info', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{
        description: 'something changed', status: 'failed', user: {email: 'foo@foo.com'}, created_at: d, version: 10,
      }])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    return runCommand(Cmd, [
      '--app',
      'myapp',
    ])
      .then(() => expect(stdout.output).to.equal(`=== Release v10\n\nBy:      foo@foo.com\nChange:  something changed (release command failed)\nWhen:    ${d.toISOString()}\n\n=== v10 Config vars\n\nBAR: bar\nFOO: foo\n`))
      .then(() => api.done())
  })

  it('shows a pending release info', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{
        addon_plan_names: ['addon1', 'addon2'], description: 'something changed', status: 'pending', user: {email: 'foo@foo.com'}, version: 10, created_at: d,
      }])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    return runCommand(Cmd, [
      '--app',
      'myapp',
    ])
      .then(() => expect(stdout.output).to.equal(`=== Release v10\n\nAdd-ons: addon1\n         addon2\nBy:      foo@foo.com\nChange:  something changed (release command executing)\nWhen:    ${d.toISOString()}\n\n=== v10 Config vars\n\nBAR: bar\nFOO: foo\n`))
      .then(() => api.done())
  })
})
