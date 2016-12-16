'use strict'
/* globals describe beforeEach it commands */

const nock = require('nock')
const cli = require('heroku-cli-util')
const expect = require('chai').expect
const cmd = commands.find((c) => c.topic === 'apps' && c.command === 'info')

let app = {
  name: 'myapp',
  database_size: 1000,
  create_status: 'complete',
  repo_size: 1000,
  slug_size: 1000,
  git_url: 'https://git.heroku.com/myapp',
  web_url: 'https://myapp.herokuapp.com',
  region: {name: 'eu'},
  stack: {name: 'cedar-14'},
  owner: {email: 'foo@foo.com'},
  space: {name: 'myspace'}
}

let addons = [
  {plan: {name: 'papertrail'}},
  {plan: {name: 'heroku-redis'}}
]

let collaborators = [
  {user: {email: 'foo@foo.com'}},
  {user: {email: 'foo2@foo.com'}}
]

describe('apps:info', () => {
  beforeEach(() => cli.mockConsole())

  it('shows app info', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp').reply(200, app)
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.equal(`=== myapp
Addons:        heroku-redis
               papertrail
Collaborators: foo2@foo.com
Database Size: 1000 B
Dynos:         web: 1
Git URL:       https://git.heroku.com/myapp
Owner:         foo@foo.com
Region:        eu
Repo Size:     1000 B
Slug Size:     1000 B
Space:         myspace
Stack:         cedar-14
Web URL:       https://myapp.herokuapp.com
`))
      .then(() => api.done())
  })

  it('shows app info via arg', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp').reply(200, app)
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    let context = {args: {app: 'myapp'}, flags: {}}
    return cmd.run(context)
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.equal(`=== myapp
Addons:        heroku-redis
               papertrail
Collaborators: foo2@foo.com
Database Size: 1000 B
Dynos:         web: 1
Git URL:       https://git.heroku.com/myapp
Owner:         foo@foo.com
Region:        eu
Repo Size:     1000 B
Slug Size:     1000 B
Space:         myspace
Stack:         cedar-14
Web URL:       https://myapp.herokuapp.com
`))
      .then(() => api.done())
      .then(() => expect(context.app).to.equal('myapp'))
  })

  it('shows app info in shell format', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp').reply(200, app)
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    return cmd.run({args: {app: 'myapp'}, flags: {shell: true}})
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.equal(`addons=heroku-redis,papertrail
collaborators=foo2@foo.com
database_size=1000 B
git_url=https://git.heroku.com/myapp
web_url=https://myapp.herokuapp.com
repo_size=1000 B
slug_size=1000 B
owner=foo@foo.com
region=eu
dynos={ web: 1 }
stack=cedar-14
`))
      .then(() => api.done())
  })
})
