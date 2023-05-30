'use strict'
/* globals beforeEach commands */

const nock = require('nock')
const cli = require('heroku-cli-util')
const expect = require('chai').expect
const cmd = commands.find(c => c.topic === 'apps' && c.command === 'info')
const unwrap = require('../../../unwrap')

let app = {
  name: 'myapp',
  database_size: 1000,
  create_status: 'complete',
  repo_size: 1000,
  slug_size: 1000,
  git_url: 'https://git.heroku.com/myapp',
  web_url: 'https://myapp.herokuapp.com',
  region: {name: 'eu'},
  build_stack: {name: 'cedar-14'},
  stack: {name: 'cedar-14'},
  owner: {email: 'foo@foo.com'},
  space: {name: 'myspace'},
  internal_routing: true,
}

let appStackChange = Object.assign({}, app, {
  build_stack: {name: 'heroku-22'},
})

let appExtended = Object.assign({}, app, {
  extended: {
    foo: 'bar',
    id: 12345,
  },
})

let appAcm = Object.assign({}, app, {
  acm: true,
})

let addons = [
  {plan: {name: 'papertrail'}},
  {plan: {name: 'heroku-redis'}},
]

let collaborators = [
  {user: {email: 'foo@foo.com'}},
  {user: {email: 'foo2@foo.com'}},
]

describe('apps:info', () => {
  beforeEach(() => cli.mockConsole())

  it('shows app info', () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.equal(`=== myapp
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
`))
      .then(() => appApi.done())
      .then(() => api.done())
  })

  it('shows extended app info', () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp?extended=true').reply(200, appExtended)
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    return cmd.run({app: 'myapp', args: {}, flags: {extended: true}})
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.equal(`=== myapp
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
`))
      .then(() => appApi.done())
      .then(() => api.done())
  })

  it('shows empty extended app info when not defined', () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp?extended=true').reply(200, appAcm)
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    return cmd.run({app: 'myapp', args: {}, flags: {extended: true}})
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.equal(`=== myapp
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


`))
      .then(() => appApi.done())
      .then(() => api.done())
  })
  it('shows app info via arg', () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    let context = {args: {app: 'myapp'}, flags: {}}
    return cmd.run(context)
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.equal(`=== myapp
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
`))
      .then(() => appApi.done())
      .then(() => api.done())
      .then(() => expect(context.app).to.equal('myapp'))
  })

  it('shows app info via arg when the app is in a pipeline', () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/pipeline-couplings').reply(200, {app: {id: appAcm.id}, pipeline: {name: 'my-pipeline'}, stage: 'production'})
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    let context = {args: {app: 'myapp'}, flags: {}}
    return cmd.run(context)
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.equal(`=== myapp
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
`))
      .then(() => appApi.done())
      .then(() => api.done())
      .then(() => expect(context.app).to.equal('myapp'))
  })

  it('shows app info in shell format', () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    return cmd.run({args: {app: 'myapp'}, flags: {shell: true}})
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.equal(`auto_cert_mgmt=true
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
`))
      .then(() => appApi.done())
      .then(() => api.done())
  })

  it('shows app info in shell format when the app is in pipeline', () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/pipeline-couplings').reply(200, {app: {id: appAcm.id}, pipeline: {name: 'my-pipeline'}, stage: 'production'})
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    return cmd.run({args: {app: 'myapp'}, flags: {shell: true}})
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.equal(`auto_cert_mgmt=true
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
`))
      .then(() => appApi.done())
      .then(() => api.done())
  })

  it('shows extended app info in json format', () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp?extended=true').reply(200, appExtended)
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    return cmd.run({args: {app: 'myapp'}, flags: {json: true, extended: true}})
      .then(() => {
        let json = JSON.parse(cli.stdout)
        expect(json.appExtended).to.equal(undefined)
        expect(json.app.extended).not.to.equal(undefined)
        expect(json.app.extended.id).to.equal(appExtended.extended.id)
      })
      .then(() => appApi.done())
      .then(() => api.done())
  })

  it('shows app info in json format', () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }).get('/apps/myapp').reply(200, appAcm)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
      .get('/apps/myapp/pipeline-couplings').reply(200, {app: {id: appAcm.id}, pipeline: {name: 'my-pipeline'}})
    return cmd.run({args: {app: 'myapp'}, flags: {json: true}})
      .then(() => {
        let json = JSON.parse(cli.stdout)
        expect(json.appExtended).to.equal(undefined)
        expect(json.app.extended).to.equal(undefined)
        expect(json.addons.length).to.equal(addons.length)
        expect(json.collaborators.length).to.equal(collaborators.length)
        expect(json.dynos[0].type).to.equal('web')
        expect(json.pipeline_coupling.pipeline.name).to.equal('my-pipeline')
      })
      .then(() => appApi.done())
      .then(() => api.done())
  })

  it('shows app info with a stack change', () => {
    let appApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }).get('/apps/myapp').reply(200, appStackChange)

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.equal(`=== myapp
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
Stack:            cedar-14 (next build will use heroku-22)
Web URL:          https://myapp.herokuapp.com
`))
      .then(() => appApi.done())
      .then(() => api.done())
  })
})
