import {expect, test} from '@oclif/test'
import type {App} from '../../../../src/lib/types/fir'
import {unwrap} from '../../../helpers/utils/unwrap'

const app = {
  id: 'app-id',
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
  generation: 'cedar',
  internal_routing: true,
}

const firApp = {
  id: 'app-id',
  name: 'myapp',
  database_size: 1000,
  create_status: 'complete',
  repo_size: 1000,
  slug_size: null,
  git_url: 'https://git.heroku.com/myapp',
  web_url: 'https://myapp.herokuapp.com',
  region: {name: 'eu', id: ''},
  build_stack: {name: 'cedar-14'},
  stack: {name: 'cedar-14'},
  owner: {email: 'foo@foo.com', id: ''},
  space: {name: 'myspace'},
  generation: 'fir',
  internal_routing: true,
}

const appStackChange = Object.assign({}, app, {
  build_stack: {name: 'heroku-24'},
})

const appExtended = Object.assign({}, app, {
  extended: {
    foo: 'bar',
    id: 12345,
  },
})

const appAcm = Object.assign({}, app, {
  acm: true,
})

const firAppAcm = Object.assign({}, firApp, {
  acm: true,
})

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
`

const BASE_INFO_FIR = `=== myapp

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
Space:            myspace
Stack:            cedar-14
Web URL:          https://myapp.herokuapp.com
`

describe('apps:info', function () {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, appAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp/addons')
        .reply(200, addons)
        .get('/apps/myapp/collaborators')
        .reply(200, collaborators)
        .get('/apps/myapp/dynos')
        .reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', '-a', 'myapp'])
    .it('shows app info', ({stdout, stderr}) => {
      expect(stdout).to.equal(BASE_INFO)
      expect(unwrap(stderr)).to.contains('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, appAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp?extended=true')
        .reply(200, appExtended)
        .get('/apps/myapp/addons')
        .reply(200, addons)
        .get('/apps/myapp/collaborators')
        .reply(200, collaborators)
        .get('/apps/myapp/dynos')
        .reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', '-a', 'myapp', '--extended'])
    .it('shows extended app info', ({stdout, stderr}) => {
      expect(stdout).to.equal(`${BASE_INFO}

--- Extended Information ---


{ foo: 'bar', id: 12345 }
`)
      expect(unwrap(stderr)).to.contains('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, appAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp?extended=true').reply(200, appAcm)
        .get('/apps/myapp/addons').reply(200, addons)
        .get('/apps/myapp/collaborators').reply(200, collaborators)
        .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', '-a', 'myapp', '--extended'])
    .it('shows empty extended app info when not defined', ({stdout, stderr}) => {
      expect(stdout).to.equal(`${BASE_INFO}

--- Extended Information ---


`)
      expect(unwrap(stderr)).to.contains('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, appAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp/addons').reply(200, addons)
        .get('/apps/myapp/collaborators').reply(200, collaborators)
        .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', 'myapp'])
    .it('shows app info via arg', ({stdout, stderr}) => {
      expect(stdout).to.equal(BASE_INFO)
      expect(unwrap(stderr)).to.contains('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, appAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp/pipeline-couplings').reply(200, {app: {id: appAcm.id}, pipeline: {name: 'my-pipeline'}, stage: 'production'})
        .get('/apps/myapp/addons').reply(200, addons)
        .get('/apps/myapp/collaborators').reply(200, collaborators)
        .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', 'myapp'])
    .it('shows app info via arg when the app is in a pipeline', ({stdout, stderr}) => {
      expect(stdout).to.equal(`=== myapp

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
`)
      expect(unwrap(stderr)).to.contains('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, appAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp/addons').reply(200, addons)
        .get('/apps/myapp/collaborators').reply(200, collaborators)
        .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', 'myapp', '--shell'])
    .it('shows app info in shell format', ({stdout, stderr}) => {
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

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, appAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp/pipeline-couplings').reply(200, {app: {id: appAcm.id}, pipeline: {name: 'my-pipeline'}, stage: 'production'})
        .get('/apps/myapp/addons').reply(200, addons)
        .get('/apps/myapp/collaborators').reply(200, collaborators)
        .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', 'myapp', '--shell'])
    .it('shows app info in shell format when the app is in pipeline', ({stdout, stderr}) => {
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

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, appAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp?extended=true').reply(200, appExtended)
        .get('/apps/myapp/addons').reply(200, addons)
        .get('/apps/myapp/collaborators').reply(200, collaborators)
        .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', 'myapp', '--extended', '--json'])
    .it('shows extended app info in json format', ({stdout, stderr}) => {
      const json = JSON.parse(stdout)
      expect(json.appExtended).to.equal(undefined)
      expect(json.app.extended).not.to.equal(undefined)
      expect(json.app.extended.id).to.equal(appExtended.extended.id)
      expect(unwrap(stderr)).to.contains('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, appAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp/addons').reply(200, addons)
        .get('/apps/myapp/collaborators').reply(200, collaborators)
        .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}])
        .get('/apps/myapp/pipeline-couplings').reply(200, {app: {id: appAcm.id}, pipeline: {name: 'my-pipeline'}}),
    )
    .command(['apps:info', 'myapp', '--json'])
    .it('shows app info in json format', ({stdout, stderr}) => {
      const json = JSON.parse(stdout)
      expect(json.appExtended).to.equal(undefined)
      expect(json.app.extended).to.equal(undefined)
      expect(json.addons.length).to.equal(addons.length)
      expect(json.collaborators.length).to.equal(collaborators.length)
      expect(json.dynos[0].type).to.equal('web')
      expect(json.pipeline_coupling.pipeline.name).to.equal('my-pipeline')
      expect(unwrap(stderr)).to.contains('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, appStackChange),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp/addons').reply(200, addons)
        .get('/apps/myapp/collaborators').reply(200, collaborators)
        .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', 'myapp'])
    .it('shows app info with a stack change', ({stdout, stderr}) => {
      expect(stdout).to.equal(`=== myapp

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
Stack:            cedar-14 (next build will use heroku-24)
Web URL:          https://myapp.herokuapp.com
`)
      expect(unwrap(stderr)).to.contains('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, firAppAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp/addons')
        .reply(200, addons)
        .get('/apps/myapp/collaborators')
        .reply(200, collaborators)
        .get('/apps/myapp/dynos')
        .reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', '-a', 'myapp'])
    .it('shows fir app info without slug size', ({stdout, stderr}) => {
      expect(stdout).to.equal(BASE_INFO_FIR)
      expect(unwrap(stderr)).to.contains('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .get('/apps/myapp')
        .reply(200, firAppAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp/addons').reply(200, addons)
        .get('/apps/myapp/collaborators').reply(200, collaborators)
        .get('/apps/myapp/dynos').reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', 'myapp', '--shell'])
    .it('shows fir app info in shell format without slug size', ({stdout, stderr}) => {
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
