'use strict'
/* globals describe beforeEach it commands */

const nock = require('nock')
const cli = require('heroku-cli-util')
const expect = require('chai').expect
const cmd = commands.find((c) => c.topic === 'apps' && c.command === 'info')
const unwrap = require('../../unwrap')

let app = {
  name: 'myapp',
  database_size: 1000,
  create_status: 'complete',
  repo_size: 1000,
  slug_size: 1000,
  git_url: 'https://git.heroku.com/myapp',
  web_url: 'https://myapp.herokuapp.com',
  region: { name: 'eu' },
  build_stack: { name: 'cedar-14' },
  stack: { name: 'cedar-14' },
  owner: { email: 'foo@foo.com' },
  space: { name: 'myspace' },
  internal_routing: true
}

let appStackChange = Object.assign({}, app, {
  build_stack: { name: 'heroku-20' }
})

let appExtended = Object.assign({}, app, {
  extended: {
    foo: 'bar',
    id: 12345
  }
})

let appAcm = Object.assign({}, app, {
  acm: true
})

let addons = [
  { plan: { name: 'papertrail' } },
  { plan: { name: 'heroku-redis' } }
]

let collaborators = [
  { user: { email: 'foo@foo.com' } },
  { user: { email: 'foo2@foo.com' } }
]

describe('apps:info', () => {
  beforeEach(() => cli.mockConsole())

  it('shows app info', async () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{ type: 'web', size: 'Standard-1X', quantity: 2 }])

    await cmd.run({ app: 'myapp', args: {}, flags: {} })

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(`=== myapp
Addons:           heroku-redis
                  papertrail
Auto Cert Mgmt:   true
Collaborators:    foo2@foo.com
Database Size:    1000 B
Dynos:            web: 1
Git URL:          https://git.heroku.com/myapp
Internal Routing: true
Owner:            foo@foo.com
Region:           eu
Repo Size:        1000 B
Slug Size:        1000 B
Space:            myspace
Stack:            cedar-14
Web URL:          https://myapp.herokuapp.com
`);

    appApi.done();

    return api.done()
  })

  it('shows extended app info', async () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp?extended=true').reply(200, appExtended)
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{ type: 'web', size: 'Standard-1X', quantity: 2 }])

    await cmd.run({ app: 'myapp', args: {}, flags: { extended: true } })

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(`=== myapp
Addons:           heroku-redis
                  papertrail
Auto Cert Mgmt:   true
Collaborators:    foo2@foo.com
Database Size:    1000 B
Dynos:            web: 1
Git URL:          https://git.heroku.com/myapp
Internal Routing: true
Owner:            foo@foo.com
Region:           eu
Repo Size:        1000 B
Slug Size:        1000 B
Space:            myspace
Stack:            cedar-14
Web URL:          https://myapp.herokuapp.com


--- Extended Information ---


{ foo: 'bar', id: 12345 }
`);

    appApi.done();

    return api.done()
  })

  it('shows empty extended app info when not defined', async () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp?extended=true').reply(200, appAcm)
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{ type: 'web', size: 'Standard-1X', quantity: 2 }])

    await cmd.run({ app: 'myapp', args: {}, flags: { extended: true } })

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(`=== myapp
Addons:           heroku-redis
                  papertrail
Auto Cert Mgmt:   true
Collaborators:    foo2@foo.com
Database Size:    1000 B
Dynos:            web: 1
Git URL:          https://git.heroku.com/myapp
Internal Routing: true
Owner:            foo@foo.com
Region:           eu
Repo Size:        1000 B
Slug Size:        1000 B
Space:            myspace
Stack:            cedar-14
Web URL:          https://myapp.herokuapp.com


--- Extended Information ---


`);

    appApi.done();

    return api.done()
  })
  it('shows app info via arg', async () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{ type: 'web', size: 'Standard-1X', quantity: 2 }])
    let context = { args: { app: 'myapp' }, flags: {} }

    await cmd.run(context)

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(`=== myapp
Addons:           heroku-redis
                  papertrail
Auto Cert Mgmt:   true
Collaborators:    foo2@foo.com
Database Size:    1000 B
Dynos:            web: 1
Git URL:          https://git.heroku.com/myapp
Internal Routing: true
Owner:            foo@foo.com
Region:           eu
Repo Size:        1000 B
Slug Size:        1000 B
Space:            myspace
Stack:            cedar-14
Web URL:          https://myapp.herokuapp.com
`);

    appApi.done();
    api.done();

    return expect(context.app).to.equal('myapp')
  })

  it('shows app info via arg when the app is in a pipeline', async () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/pipeline-couplings').reply(200, { app: { id: appAcm.id }, pipeline: { name: 'my-pipeline' }, stage: 'production' })
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{ type: 'web', size: 'Standard-1X', quantity: 2 }])
    let context = { args: { app: 'myapp' }, flags: {} }

    await cmd.run(context)

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(`=== myapp
Addons:           heroku-redis
                  papertrail
Auto Cert Mgmt:   true
Collaborators:    foo2@foo.com
Database Size:    1000 B
Dynos:            web: 1
Git URL:          https://git.heroku.com/myapp
Internal Routing: true
Owner:            foo@foo.com
Pipeline:         my-pipeline - production
Region:           eu
Repo Size:        1000 B
Slug Size:        1000 B
Space:            myspace
Stack:            cedar-14
Web URL:          https://myapp.herokuapp.com
`);

    appApi.done();
    api.done();

    return expect(context.app).to.equal('myapp')
  })

  it('shows app info in shell format', async () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{ type: 'web', size: 'Standard-1X', quantity: 2 }])

    await cmd.run({ args: { app: 'myapp' }, flags: { shell: true } })

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(`auto_cert_mgmt=true
addons=heroku-redis,papertrail
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
`);

    appApi.done();

    return api.done()
  })

  it('shows app info in shell format when the app is in pipeline', async () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/pipeline-couplings').reply(200, { app: { id: appAcm.id }, pipeline: { name: 'my-pipeline' }, stage: 'production' })
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{ type: 'web', size: 'Standard-1X', quantity: 2 }])

    await cmd.run({ args: { app: 'myapp' }, flags: { shell: true } })

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(`auto_cert_mgmt=true
addons=heroku-redis,papertrail
collaborators=foo2@foo.com
database_size=1000 B
pipeline=my-pipeline:production
git_url=https://git.heroku.com/myapp
web_url=https://myapp.herokuapp.com
repo_size=1000 B
slug_size=1000 B
owner=foo@foo.com
region=eu
dynos={ web: 1 }
stack=cedar-14
`);

    appApi.done();

    return api.done()
  })

  it('shows extended app info in json format', async () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp?extended=true').reply(200, appExtended)
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{ type: 'web', size: 'Standard-1X', quantity: 2 }])

    await cmd.run({ args: { app: 'myapp' }, flags: { json: true, extended: true } })

    expect(json.app.extended.id).to.equal(appExtended.extended.id)
    expect(json.app.extended).not.to.equal(undefined)
    expect(json.appExtended).to.equal(undefined)
    let json = JSON.parse(cli.stdout)
    appApi.done();

    return api.done()
  })

  it('shows app info in json format', async () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{ type: 'web', size: 'Standard-1X', quantity: 2 }])
      .get('/apps/myapp/pipeline-couplings').reply(200, { app: { id: appAcm.id }, pipeline: { name: 'my-pipeline' } })

    await cmd.run({ args: { app: 'myapp' }, flags: { json: true } })

    expect(json.pipeline_coupling.pipeline.name).to.equal('my-pipeline')
    expect(json.dynos[0].type).to.equal('web')
    expect(json.collaborators.length).to.equal(collaborators.length)
    expect(json.addons.length).to.equal(addons.length)
    expect(json.app.extended).to.equal(undefined)
    expect(json.appExtended).to.equal(undefined)
    let json = JSON.parse(cli.stdout)
    appApi.done();

    return api.done()
  })

  it('shows app info with a stack change', async () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    }).get('/apps/myapp').reply(200, appStackChange)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{ type: 'web', size: 'Standard-1X', quantity: 2 }])

    await cmd.run({ app: 'myapp', args: {}, flags: {} })

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(`=== myapp
Addons:           heroku-redis
                  papertrail
Collaborators:    foo2@foo.com
Database Size:    1000 B
Dynos:            web: 1
Git URL:          https://git.heroku.com/myapp
Internal Routing: true
Owner:            foo@foo.com
Region:           eu
Repo Size:        1000 B
Slug Size:        1000 B
Space:            myspace
Stack:            cedar-14 (next build will use heroku-20)
Web URL:          https://myapp.herokuapp.com
`);

    appApi.done();

    return api.done()
  })
})
