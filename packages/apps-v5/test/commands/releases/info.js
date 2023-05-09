'use strict'
/* globals beforeEach commands afterEach */

const nock = require('nock')
const cli = require('heroku-cli-util')
const cmd = commands.find(c => c.topic === 'releases' && c.command === 'info')
const {expect} = require('chai')

let d = new Date(2000, 1, 1)

describe('releases:info', function () {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  let release = {
    description: 'something changed',
    user: {
      email: 'foo@foo.com',
    },
    created_at: d,
    version: 10,
    addon_plan_names: ['addon1', 'addon2'],
  }
  let configVars = {FOO: 'foo', BAR: 'bar'}

  it('shows most recent release info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [release])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    return cmd.run({app: 'myapp', flags: {}, args: {}})
      .then(() => expect(cli.stdout).to.equal(`=== Release v10
Add-ons: addon1
         addon2
By:      foo@foo.com
Change:  something changed
When:    ${d.toISOString()}

=== v10 Config vars
BAR: bar
FOO: foo
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows most recent release info config vars as shell', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [release])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    return cmd.run({app: 'myapp', flags: {shell: true}, args: {}})
      .then(() => expect(cli.stdout).to.equal(`=== Release v10
Add-ons: addon1
         addon2
By:      foo@foo.com
Change:  something changed
When:    ${d.toISOString()}

=== v10 Config vars
FOO=foo
BAR=bar
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows release info by id', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, release)
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    return cmd.run({app: 'myapp', flags: {}, args: {release: 'v10'}})
      .then(() => expect(cli.stdout).to.equal(`=== Release v10
Add-ons: addon1
         addon2
By:      foo@foo.com
Change:  something changed
When:    ${d.toISOString()}

=== v10 Config vars
BAR: bar
FOO: foo
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows recent release as json', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, release)
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    return cmd.run({app: 'myapp', flags: {json: true}, args: {release: 'v10'}})
      .then(() => expect(JSON.parse(cli.stdout), 'to satisfy', {version: 10}))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows a failed release info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{
        description: 'something changed',
        status: 'failed',
        user: {email: 'foo@foo.com'},
        created_at: d,
        version: 10,
      }])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    return cmd.run({app: 'myapp', flags: {}, args: {}})
      .then(() => expect(cli.stdout).to.equal(`=== Release v10
By:      foo@foo.com
Change:  something changed (release command failed)
When:    ${d.toISOString()}

=== v10 Config vars
BAR: bar
FOO: foo
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows a pending release info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{
        addon_plan_names: ['addon1', 'addon2'],
        description: 'something changed',
        status: 'pending',
        user: {email: 'foo@foo.com'},
        version: 10,
        created_at: d,
      }])
      .get('/apps/myapp/releases/10/config-vars')
      .reply(200, configVars)
    return cmd.run({app: 'myapp', flags: {}, args: {}})
      .then(() => expect(cli.stdout).to.equal(`=== Release v10
Add-ons: addon1
         addon2
By:      foo@foo.com
Change:  something changed (release command executing)
When:    ${d.toISOString()}

=== v10 Config vars
BAR: bar
FOO: foo
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })
})
