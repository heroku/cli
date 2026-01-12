import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import type {App} from '../../../../src/lib/types/fir.js'

import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('apps:info', function () {
  const app = {
    build_stack: {name: 'cedar-14'},
    create_status: 'complete',
    database_size: 1000,
    generation: 'cedar',
    git_url: 'https://git.heroku.com/myapp',
    id: 'app-id',
    internal_routing: true,
    name: 'myapp',
    owner: {email: 'foo@foo.com'},
    region: {name: 'eu'},
    repo_size: 1000,
    slug_size: 1000,
    space: {name: 'myspace'},
    stack: {name: 'cedar-14'},
    web_url: 'https://myapp.herokuapp.com',
  }

  const firApp = {
    build_stack: {name: 'cedar-14'},
    create_status: 'complete',
    database_size: 1000,
    generation: 'fir',
    git_url: 'https://git.heroku.com/myapp',
    id: 'app-id',
    internal_routing: true,
    name: 'myapp',
    owner: {email: 'foo@foo.com', id: ''},
    region: {name: 'eu', id: ''},
    repo_size: 1000,
    slug_size: null,
    space: {name: 'myspace'},
    stack: {name: 'cedar-14'},
    web_url: 'https://myapp.herokuapp.com',
  }

  const appStackChange = {...app, build_stack: {name: 'heroku-24'}}

  const appExtended = {...app, extended: {foo: 'bar', id: 12345}}

  const appAcm = {...app, acm: true}

  const firAppAcm = {...firApp, acm: true}

  const addons = [
    {plan: {name: 'papertrail'}},
    {plan: {name: 'heroku-redis'}},
  ]

  const collaborators = [
    {user: {email: 'foo@foo.com'}},
    {user: {email: 'foo2@foo.com'}},
  ]

  const BASE_INFO = `=== myapp

Addons:           heroku-redis
                  papertrail
Collaborators:    foo2@foo.com
Database Size:    1000 B
Space:            myspace
Internal Routing: true
Auto Cert Mgmt:   true
Git URL:          https://git.heroku.com/myapp
Web URL:          https://myapp.herokuapp.com
Repo Size:        1000 B
Slug Size:        1000 B
Owner:            foo@foo.com
Region:           eu
Dynos:            web: 1
Stack:            cedar-14
`

  const BASE_INFO_FIR = `=== myapp

Addons:           heroku-redis
                  papertrail
Collaborators:    foo2@foo.com
Database Size:    1000 B
Space:            myspace
Internal Routing: true
Auto Cert Mgmt:   true
Git URL:          https://git.heroku.com/myapp
Web URL:          https://myapp.herokuapp.com
Repo Size:        1000 B
Owner:            foo@foo.com
Region:           eu
Dynos:            web: 1
Stack:            cedar-14
`

  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows app info', async function () {
    api
      .get('/apps/myapp')
      .reply(200, appAcm)
    api
      .get('/apps/myapp/addons')
      .reply(200, addons)
      .get('/apps/myapp/collaborators')
      .reply(200, collaborators)
      .get('/apps/myapp/dynos')
      .reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])

    const {stderr, stdout} = await runCommand(['apps:info', '-a', 'myapp'])

    expect(stdout).to.equal(BASE_INFO)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows extended app info', async function () {
    api
      .get('/apps/myapp')
      .reply(200, appAcm)
    api
      .get('/apps/myapp?extended=true')
      .reply(200, appExtended)
      .get('/apps/myapp/addons')
      .reply(200, addons)
      .get('/apps/myapp/collaborators')
      .reply(200, collaborators)
      .get('/apps/myapp/dynos')
      .reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])

    const {stderr, stdout} = await runCommand(['apps:info', '-a', 'myapp', '--extended'])

    expect(stdout).to.equal(`${BASE_INFO}

--- Extended Information ---


{ foo: 'bar', id: 12345 }
`)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows empty extended app info when not defined', async function () {
    api
      .get('/apps/myapp')
      .reply(200, appAcm)
    api
      .get('/apps/myapp?extended=true').reply(200, appAcm)
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])

    const {stderr, stdout} = await runCommand(['apps:info', '-a', 'myapp', '--extended'])

    expect(stdout).to.equal(`${BASE_INFO}

--- Extended Information ---


`)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows app info via arg', async function () {
    api
      .get('/apps/myapp')
      .reply(200, appAcm)
    api
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])

    const {stderr, stdout} = await runCommand(['apps:info', 'myapp'])

    expect(stdout).to.equal(BASE_INFO)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows app info via arg when the app is in a pipeline', async function () {
    api
      .get('/apps/myapp')
      .reply(200, appAcm)
    api
      .get('/apps/myapp/pipeline-couplings').reply(200, {app: {id: appAcm.id}, pipeline: {name: 'my-pipeline'}, stage: 'production'})
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])

    const {stderr, stdout} = await runCommand(['apps:info', 'myapp'])

    expect(stdout).to.equal(`=== myapp

Addons:           heroku-redis
                  papertrail
Collaborators:    foo2@foo.com
Database Size:    1000 B
Space:            myspace
Internal Routing: true
Pipeline:         my-pipeline - production
Auto Cert Mgmt:   true
Git URL:          https://git.heroku.com/myapp
Web URL:          https://myapp.herokuapp.com
Repo Size:        1000 B
Slug Size:        1000 B
Owner:            foo@foo.com
Region:           eu
Dynos:            web: 1
Stack:            cedar-14
`)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows app info in shell format', async function () {
    api
      .get('/apps/myapp')
      .reply(200, appAcm)
    api
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])

    const {stderr, stdout} = await runCommand(['apps:info', 'myapp', '--shell'])

    expect(stdout).to.equal(`auto_cert_mgmt=true
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
`)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows app info in shell format when the app is in pipeline', async function () {
    api
      .get('/apps/myapp')
      .reply(200, appAcm)
    api
      .get('/apps/myapp/pipeline-couplings').reply(200, {app: {id: appAcm.id}, pipeline: {name: 'my-pipeline'}, stage: 'production'})
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])

    const {stderr, stdout} = await runCommand(['apps:info', 'myapp', '--shell'])

    expect(stdout).to.equal(`auto_cert_mgmt=true
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
`)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows extended app info in json format', async function () {
    api
      .get('/apps/myapp')
      .reply(200, appAcm)
    api
      .get('/apps/myapp?extended=true').reply(200, appExtended)
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])

    const {stderr, stdout} = await runCommand(['apps:info', 'myapp', '--extended', '--json'])

    const json = JSON.parse(stdout)
    expect(json.appExtended).to.equal(undefined)
    expect(json.app.extended).not.to.equal(undefined)
    expect(json.app.extended.id).to.equal(appExtended.extended.id)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows app info in json format', async function () {
    api
      .get('/apps/myapp')
      .reply(200, appAcm)
    api
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])
      .get('/apps/myapp/pipeline-couplings').reply(200, {app: {id: appAcm.id}, pipeline: {name: 'my-pipeline'}})

    const {stderr, stdout} = await runCommand(['apps:info', 'myapp', '--json'])

    const json = JSON.parse(stdout)
    expect(json.appExtended).to.equal(undefined)
    expect(json.app.extended).to.equal(undefined)
    expect(json.addons.length).to.equal(addons.length)
    expect(json.collaborators.length).to.equal(collaborators.length)
    expect(json.dynos[0].type).to.equal('web')
    expect(json.pipeline_coupling.pipeline.name).to.equal('my-pipeline')
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows app info with a stack change', async function () {
    api
      .get('/apps/myapp')
      .reply(200, appStackChange)
    api
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])

    const {stderr, stdout} = await runCommand(['apps:info', 'myapp'])

    expect(stdout).to.equal(`=== myapp

Addons:           heroku-redis
                  papertrail
Collaborators:    foo2@foo.com
Database Size:    1000 B
Space:            myspace
Internal Routing: true
Git URL:          https://git.heroku.com/myapp
Web URL:          https://myapp.herokuapp.com
Repo Size:        1000 B
Slug Size:        1000 B
Owner:            foo@foo.com
Region:           eu
Dynos:            web: 1
Stack:            cedar-14 (next build will use heroku-24)
`)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows fir app info without slug size', async function () {
    api
      .get('/apps/myapp')
      .reply(200, firAppAcm)
    api
      .get('/apps/myapp/addons')
      .reply(200, addons)
      .get('/apps/myapp/collaborators')
      .reply(200, collaborators)
      .get('/apps/myapp/dynos')
      .reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])

    const {stderr, stdout} = await runCommand(['apps:info', '-a', 'myapp'])

    expect(stdout).to.equal(BASE_INFO_FIR)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows fir app info in shell format without slug size', async function () {
    api
      .get('/apps/myapp')
      .reply(200, firAppAcm)
    api
      .get('/apps/myapp/addons').reply(200, addons)
      .get('/apps/myapp/collaborators').reply(200, collaborators)
      .get('/apps/myapp/dynos').reply(200, [{quantity: 2, size: 'Standard-1X', type: 'web'}])

    const {stderr, stdout} = await runCommand(['apps:info', 'myapp', '--shell'])

    expect(stdout).to.equal(`auto_cert_mgmt=true
addons=heroku-redis,papertrail
collaborators=foo2@foo.com
database_size=1000 B
git_url=https://git.heroku.com/myapp
web_url=https://myapp.herokuapp.com
repo_size=1000 B
owner=foo@foo.com
region=eu
dynos={ web: 1 }
stack=cedar-14
`)
    expect(unwrap(stderr)).to.contains('')
  })
})
