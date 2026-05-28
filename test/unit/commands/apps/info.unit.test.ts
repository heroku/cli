import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import Info from '../../../../src/commands/apps/info.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

type FakePlatform = {
  addOn: {listByApp: sinon.SinonStub}
  app: {info: sinon.SinonStub}
  collaborator: {list: sinon.SinonStub}
  dyno: {list: sinon.SinonStub}
  pipelineCoupling: {infoByApp: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    addOn: {listByApp: sinon.stub()},
    app: {info: sinon.stub()},
    collaborator: {list: sinon.stub()},
    dyno: {list: sinon.stub()},
    pipelineCoupling: {infoByApp: sinon.stub()},
  }
}

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
    region: {id: '', name: 'eu'},
    repo_size: 1000,
    slug_size: null,
    space: {name: 'myspace'},
    stack: {name: 'cedar-14'},
    web_url: 'https://myapp.herokuapp.com',
  }

  const appStackChange = {...app, build_stack: {name: 'heroku-24'}}

  const appExtended = {...app, extended: {foo: 'bar', id: 12_345}}

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

  const dynos = [{quantity: 2, size: 'Standard-1X', type: 'web'}]

  const BASE_INFO = `=== ⬢ myapp

Addons:           heroku-redis
                  papertrail
Collaborators:    foo2@foo.com
Database Size:    1000 B
Space:            ⬡ myspace
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

  const BASE_INFO_FIR = `=== ⬢ myapp

Addons:           heroku-redis
                  papertrail
Collaborators:    foo2@foo.com
Database Size:    1000 B
Space:            ⬡ myspace
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

  let fakePlatform: FakePlatform

  function stubBaseInfo(appPayload: Record<string, unknown> = appAcm) {
    fakePlatform.app.info.resolves(appPayload)
    fakePlatform.addOn.listByApp.resolves(addons)
    fakePlatform.collaborator.list.resolves(collaborators)
    fakePlatform.dyno.list.resolves(dynos)
    fakePlatform.pipelineCoupling.infoByApp.rejects(new Error('not coupled'))
  }

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
  })

  it('shows app info', async function () {
    stubBaseInfo()

    const {stderr, stdout} = await runCommand(Info, ['-a', 'myapp'])

    expect(stdout).to.equal(BASE_INFO)
    expect(unwrap(stderr)).to.contains('')
    expect(fakePlatform.app.info.calledOnceWithExactly('myapp')).to.equal(true)
    expect(fakePlatform.addOn.listByApp.calledOnceWithExactly('myapp')).to.equal(true)
    expect(fakePlatform.collaborator.list.calledOnceWithExactly('myapp')).to.equal(true)
    expect(fakePlatform.dyno.list.calledOnceWithExactly('myapp')).to.equal(true)
  })

  it('shows extended app info', async function () {
    stubBaseInfo()
    const extendedScope = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .query({extended: 'true'})
      .reply(200, appExtended)

    const {stderr, stdout} = await runCommand(Info, ['-a', 'myapp', '--extended'])

    expect(stdout).to.equal(`${BASE_INFO}

--- Extended Information ---


{ foo: 'bar', id: 12345 }
`)
    expect(unwrap(stderr)).to.contains('')
    extendedScope.done()
  })

  it('shows empty extended app info when not defined', async function () {
    stubBaseInfo()
    const extendedScope = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .query({extended: 'true'})
      .reply(200, appAcm)

    const {stderr, stdout} = await runCommand(Info, ['-a', 'myapp', '--extended'])

    expect(stdout).to.equal(`${BASE_INFO}

--- Extended Information ---


`)
    expect(unwrap(stderr)).to.contains('')
    extendedScope.done()
  })

  it('shows app info via arg', async function () {
    stubBaseInfo()

    const {stderr, stdout} = await runCommand(Info, ['myapp'])

    expect(stdout).to.equal(BASE_INFO)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows app info via arg when the app is in a pipeline', async function () {
    stubBaseInfo()
    fakePlatform.pipelineCoupling.infoByApp.resolves({
      app: {id: appAcm.id},
      pipeline: {name: 'my-pipeline'},
      stage: 'production',
    })

    const {stderr, stdout} = await runCommand(Info, ['myapp'])

    expect(stdout).to.equal(`=== ⬢ myapp

Addons:           heroku-redis
                  papertrail
Collaborators:    foo2@foo.com
Database Size:    1000 B
Space:            ⬡ myspace
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
    stubBaseInfo()

    const {stderr, stdout} = await runCommand(Info, ['myapp', '--shell'])

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
    stubBaseInfo()
    fakePlatform.pipelineCoupling.infoByApp.resolves({
      app: {id: appAcm.id},
      pipeline: {name: 'my-pipeline'},
      stage: 'production',
    })

    const {stderr, stdout} = await runCommand(Info, ['myapp', '--shell'])

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
    stubBaseInfo()
    const extendedScope = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .query({extended: 'true'})
      .reply(200, appExtended)

    const {stderr, stdout} = await runCommand(Info, ['myapp', '--extended', '--json'])

    const json = JSON.parse(stdout)
    expect(json.appExtended).to.equal(undefined)
    expect(json.app.extended).not.to.equal(undefined)
    expect(json.app.extended.id).to.equal(appExtended.extended.id)
    expect(unwrap(stderr)).to.contains('')
    extendedScope.done()
  })

  it('shows app info in json format', async function () {
    stubBaseInfo()
    fakePlatform.pipelineCoupling.infoByApp.resolves({
      app: {id: appAcm.id},
      pipeline: {name: 'my-pipeline'},
    })

    const {stderr, stdout} = await runCommand(Info, ['myapp', '--json'])

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
    stubBaseInfo(appStackChange)

    const {stderr, stdout} = await runCommand(Info, ['myapp'])

    expect(stdout).to.equal(`=== ⬢ myapp

Addons:           heroku-redis
                  papertrail
Collaborators:    foo2@foo.com
Database Size:    1000 B
Space:            ⬡ myspace
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
    stubBaseInfo(firAppAcm)

    const {stderr, stdout} = await runCommand(Info, ['-a', 'myapp'])

    expect(stdout).to.equal(BASE_INFO_FIR)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows fir app info in shell format without slug size', async function () {
    stubBaseInfo(firAppAcm)

    const {stderr, stdout} = await runCommand(Info, ['myapp', '--shell'])

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
