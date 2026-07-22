import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import lolex from 'lolex'
import nock from 'nock'
import {createSandbox} from 'sinon'

import Cmd from '../../../../src/commands/reviewapps/wait.js'
import {REVIEW_APP_ACCEPT} from '../../../../src/lib/reviewapps/wait-review-app.js'

describe('reviewapps:wait', function () {
  let api: nock.Scope
  let clock: any
  let sandbox: any

  beforeEach(function () {
    api = nock('https://api.heroku.com')
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

  it('waits until the review app is created when given an app', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: REVIEW_APP_ACCEPT}})
      .get('/apps/my-app/review-app')
      .reply(200, {
        branch: 'b', id: 'ra-1', pipeline: {id: 'p'}, status: 'creating',
      })
      .get('/apps/my-app/review-app')
      .reply(200, {
        branch: 'b', id: 'ra-1', pipeline: {id: 'p'}, status: 'created',
      })

    const {stderr} = await runCommand(Cmd, ['my-app', '--wait-interval', '1'])

    expect(stderr).to.include('Review app is building and will be ready when complete')
    expect(stderr).to.include('done')
  })

  it('prints nothing when the review app is already created', async function () {
    api
      .get('/apps/my-app/review-app')
      .reply(200, {
        branch: 'b', id: 'ra-1', pipeline: {id: 'p'}, status: 'created',
      })

    const {stderr, stdout} = await runCommand(Cmd, ['my-app'])

    expect(stderr).to.equal('')
    expect(stdout).to.equal('')
  })

  it('returns immediately for a terminal status that is not in progress', async function () {
    api
      .get('/apps/my-app/review-app')
      .reply(200, {
        branch: 'b', id: 'ra-1', pipeline: {id: 'p'}, status: 'deleted',
      })

    const {stderr, stdout} = await runCommand(Cmd, ['my-app'])

    expect(stderr).to.equal('')
    expect(stdout).to.equal('')
  })

  it('polls until complete when the review app is deleting', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: REVIEW_APP_ACCEPT}})
      .get('/apps/my-app/review-app')
      .reply(200, {
        branch: 'b', id: 'ra-1', pipeline: {id: 'p'}, status: 'deleting',
      })
      .get('/apps/my-app/review-app')
      .reply(200, {
        branch: 'b', id: 'ra-1', pipeline: {id: 'p'}, status: 'deleted',
      })

    const {stderr} = await runCommand(Cmd, ['my-app', '--wait-interval', '1'])

    expect(stderr).to.include('done')
  })

  it('surfaces the failure without notifying when the review app is already errored', async function () {
    const notifySpy = sandbox.spy(Cmd, 'notifier')
    api
      .get('/apps/my-app/review-app')
      .reply(200, {
        branch: 'b', error_status: 'kaboom', id: 'ra-1', message: null, pipeline: {id: 'p'}, status: 'errored',
      })

    const {error} = await runCommand(Cmd, ['my-app'])

    expect(error?.message).to.equal('kaboom')
    expect(notifySpy.called).to.be.false
  })

  it('throws and notifies with failure when the review app errors after polling', async function () {
    const notifySpy = sandbox.spy(Cmd, 'notifier')
    api
      .get('/apps/my-app/review-app')
      .reply(200, {
        branch: 'b', id: 'ra-1', pipeline: {id: 'p'}, status: 'creating',
      })
      .get('/apps/my-app/review-app')
      .reply(200, () => {
        clock.tick(5000)
        return {
          branch: 'b', error_status: 'creating', id: 'ra-1', message: 'Build failed.', pipeline: {id: 'p'}, status: 'errored',
        }
      })

    const {error} = await runCommand(Cmd, ['my-app', '--wait-interval', '1'])

    expect(error?.message).to.equal('Build failed.')
    expect(notifySpy.calledWith('heroku reviewapps:wait my-app', 'Review app failed to be created', false)).to.be.true
  })

  it('notifies when creation takes at least one poll interval', async function () {
    const notifySpy = sandbox.spy(Cmd, 'notifier')
    api
      .get('/apps/my-app/review-app')
      .reply(200, {
        branch: 'b', id: 'ra-1', pipeline: {id: 'p'}, status: 'creating',
      })
      .get('/apps/my-app/review-app')
      .reply(200, () => {
        clock.tick(5000)
        return {
          branch: 'b', id: 'ra-1', pipeline: {id: 'p'}, status: 'created',
        }
      })

    await runCommand(Cmd, ['my-app', '--wait-interval', '1'])

    expect(notifySpy.called).to.be.true
  })

  it('does NOT notify when creation takes less than one poll interval', async function () {
    const notifySpy = sandbox.spy(Cmd, 'notifier')
    api
      .get('/apps/my-app/review-app')
      .reply(200, {
        branch: 'b', id: 'ra-1', pipeline: {id: 'p'}, status: 'creating',
      })
      .get('/apps/my-app/review-app')
      .reply(200, {
        branch: 'b', id: 'ra-1', pipeline: {id: 'p'}, status: 'created',
      })

    await runCommand(Cmd, ['my-app', '--wait-interval', '1'])

    expect(notifySpy.called).to.be.false
  })

  it('errors when no app is provided', async function () {
    const {error} = await runCommand(Cmd, [])

    expect(error?.message).to.include('Missing 1 required arg')
  })
})
