import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import lolex from 'lolex'
import nock from 'nock'
import {createSandbox} from 'sinon'

import Cmd from '../../../../src/commands/reviewapps/create.js'
import {REVIEW_APP_ACCEPT} from '../../../../src/lib/reviewapps/wait-review-app.js'

describe('reviewapps:create', function () {
  const pipeline = {id: '123-pipeline', name: 'my-pipeline'}

  let api: nock.Scope
  let clock: any
  let sandbox: any

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    api.get('/pipelines?eq[name]=my-pipeline').reply(200, [pipeline])
    api.get(`/pipelines/${pipeline.id}/repo/branches/my-branch`).reply(200, {name: 'my-branch'})
    sandbox = createSandbox()
    clock = lolex.install()
    clock.setTimeout = function (fn: any) {
      process.nextTick(fn)
    }
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
    clock.uninstall()
    sandbox.restore()
  })

  it('prints build progress with the review app name when --wait is not passed', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: REVIEW_APP_ACCEPT}})
      .post('/review-apps', {
        branch: 'my-branch',
        pipeline: pipeline.id,
        source_blob: {url: 'resolve', version: null},
      })
      .reply(201, {
        app: null, branch: 'my-branch', id: 'ra-1', message: null, pipeline: {id: pipeline.id}, status: 'pending',
      })
      .get('/review-apps/ra-1')
      .reply(200, {
        app: {id: 'app-1'}, branch: 'my-branch', id: 'ra-1', pipeline: {id: pipeline.id}, status: 'creating',
      })
    api.get('/apps/app-1').reply(200, {id: 'app-1', name: 'my-review-app'})

    const {stderr, stdout} = await runCommand(Cmd, ['--pipeline=my-pipeline', '--branch=my-branch', '--wait-interval', '1'])

    expect(stderr).to.include('Review app is building and will be ready when complete')
    expect(stdout).to.include('heroku reviewapps:wait my-review-app')
  })

  it('resolves the app name immediately when the POST already returns an app', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: REVIEW_APP_ACCEPT}})
      .post('/review-apps')
      .reply(201, {
        app: {id: 'app-1'}, branch: 'my-branch', id: 'ra-1', message: null, pipeline: {id: pipeline.id}, status: 'pending',
      })
    api.get('/apps/app-1').reply(200, {id: 'app-1', name: 'my-review-app'})

    const {stderr, stdout} = await runCommand(Cmd, ['--pipeline=my-pipeline', '--branch=my-branch'])

    expect(stderr).to.include('Review app is building and will be ready when complete')
    expect(stdout).to.include('heroku reviewapps:wait my-review-app')
  })

  it('falls back to the background message when the app never appears', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: REVIEW_APP_ACCEPT}})
      .post('/review-apps')
      .reply(201, {
        app: null, branch: 'my-branch', id: 'ra-1', message: null, pipeline: {id: pipeline.id}, status: 'created',
      })

    const {stdout} = await runCommand(Cmd, ['--pipeline=my-pipeline', '--branch=my-branch'])

    expect(stdout).to.include('is being created in the background')
  })

  it('waits until the review app is created with --wait', async function () {
    const notifySpy = sandbox.spy(Cmd, 'notifier')
    nock('https://api.heroku.com', {reqheaders: {Accept: REVIEW_APP_ACCEPT}})
      .post('/review-apps')
      .reply(201, {
        branch: 'my-branch', id: 'ra-1', message: null, pipeline: {id: pipeline.id}, status: 'pending',
      })
      .get('/review-apps/ra-1')
      .reply(200, {
        branch: 'my-branch', id: 'ra-1', pipeline: {id: pipeline.id}, status: 'creating',
      })
      .get('/review-apps/ra-1')
      .reply(200, {
        branch: 'my-branch', id: 'ra-1', pipeline: {id: pipeline.id}, status: 'created',
      })

    const {stderr} = await runCommand(Cmd, ['--pipeline=my-pipeline', '--branch=my-branch', '--wait', '--wait-interval', '1'])

    expect(stderr).to.include('Review app is building and will be ready when complete')
    expect(notifySpy.calledWith('heroku reviewapps:create my-branch', 'Review app successfully created')).to.be.true
  })

  it('throws and notifies with failure when the review app errors with --wait', async function () {
    const notifySpy = sandbox.spy(Cmd, 'notifier')
    api
      .post('/review-apps')
      .reply(201, {
        branch: 'my-branch', id: 'ra-1', message: null, pipeline: {id: pipeline.id}, status: 'pending',
      })
      .get('/review-apps/ra-1')
      .reply(200, {
        branch: 'my-branch', error_status: 'boom', id: 'ra-1', message: null, pipeline: {id: pipeline.id}, status: 'errored',
      })

    const {error} = await runCommand(Cmd, ['--pipeline=my-pipeline', '--branch=my-branch', '--wait', '--wait-interval', '1'])

    expect(error?.message).to.equal('boom')
    expect(notifySpy.calledWith('heroku reviewapps:create my-branch', 'Review app failed to be created', false)).to.be.true
  })

  it('does not poll and prints nothing when already created with --wait', async function () {
    const notifySpy = sandbox.spy(Cmd, 'notifier')
    api
      .post('/review-apps')
      .reply(201, {
        branch: 'my-branch', id: 'ra-1', message: null, pipeline: {id: pipeline.id}, status: 'created',
      })

    const {stderr} = await runCommand(Cmd, ['--pipeline=my-pipeline', '--branch=my-branch', '--wait'])

    expect(stderr).to.not.include('Review app is building')
    expect(notifySpy.calledWith('heroku reviewapps:create my-branch', 'Review app successfully created')).to.be.true
  })

  it('errors before creating when the branch does not exist', async function () {
    nock.cleanAll()
    api = nock('https://api.heroku.com')
    api.get('/pipelines?eq[name]=my-pipeline').reply(200, [pipeline])
    api.get(`/pipelines/${pipeline.id}/repo/branches/missing-branch`).reply(404, {message: 'Not found'})

    const {error} = await runCommand(Cmd, ['--pipeline=my-pipeline', '--branch=missing-branch'])

    expect(error?.message).to.equal('Branch not found')
  })

  it('rethrows non-404 errors from the branch check instead of reporting "Branch not found"', async function () {
    nock.cleanAll()
    api = nock('https://api.heroku.com')
    api.get('/pipelines?eq[name]=my-pipeline').reply(200, [pipeline])
    api.get(`/pipelines/${pipeline.id}/repo/branches/my-branch`).reply(500, {message: 'Internal server error'})

    const {error} = await runCommand(Cmd, ['--pipeline=my-pipeline', '--branch=my-branch'])

    expect(error?.message).to.not.equal('Branch not found')
  })
})
