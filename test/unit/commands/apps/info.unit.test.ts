import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import Info from '../../../../src/commands/apps/info.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

type FakePlatform = {
  app: {describe: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {describe: sinon.stub()},
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
    fakePlatform.app.describe.resolves({
      addons,
      app: appPayload,
      collaborators,
      dynos,
      pipelineCoupling: null,
    })
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
    expect(fakePlatform.app.describe.calledOnceWithExactly('myapp')).to.equal(true)
  })

  it('shows app info via arg', async function () {
    stubBaseInfo()

    const {stderr, stdout} = await runCommand(Info, ['myapp'])

    expect(stdout).to.equal(BASE_INFO)
    expect(unwrap(stderr)).to.contains('')
  })

  it('shows app info via arg when the app is in a pipeline', async function () {
    fakePlatform.app.describe.resolves({
      addons,
      app: appAcm,
      collaborators,
      dynos,
      pipelineCoupling: {
        app: {id: appAcm.id},
        pipeline: {name: 'my-pipeline'},
        stage: 'production',
      },
    })

    const {stderr, stdout} = await runCommand(Info, ['myapp'])

    expect(stdout).to.equal(`=== ⬢ myapp

Addons:           heroku-redis
                  papertrail
Collaborators:    foo2@foo.com
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
    fakePlatform.app.describe.resolves({
      addons,
      app: appAcm,
      collaborators,
      dynos,
      pipelineCoupling: {
        app: {id: appAcm.id},
        pipeline: {name: 'my-pipeline'},
        stage: 'production',
      },
    })

    const {stderr, stdout} = await runCommand(Info, ['myapp', '--shell'])

    expect(stdout).to.equal(`auto_cert_mgmt=true
addons=heroku-redis,papertrail
collaborators=foo2@foo.com
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

  it('shows app info in json format', async function () {
    fakePlatform.app.describe.resolves({
      addons,
      app: appAcm,
      collaborators,
      dynos,
      pipelineCoupling: {
        app: {id: appAcm.id},
        pipeline: {name: 'my-pipeline'},
      },
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
