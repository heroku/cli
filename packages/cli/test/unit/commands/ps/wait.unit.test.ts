import {hux} from '@heroku/heroku-cli-util'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

const API_HOST = 'https://api.heroku.com'
const APP_NAME = 'wubalubadubdub'

const CURRENT = {
  id: '00000000-0000-0000-0000-000000000002',
  version: 23,
}

const PREVIOUS = {
  id: '00000000-0000-0000-0000-000000000001',
  version: 22,
}

describe('heroku ps:wait', function () {
  afterEach(function () {
    nock.cleanAll()
    sinon.restore()
  })

  it('warns and exits 0 if no releases', async function () {
    nock(API_HOST)
      .get(`/apps/${APP_NAME}/releases`)
      .reply(200, [])

    const {stderr} = await runCommand(['ps:wait', '--app', APP_NAME])

    expect(stderr).to.include(`Warning: App ${APP_NAME} has no releases`)
  })

  it('exits with no output if app is already on the latest release', async function () {
    nock(API_HOST)
      .get(`/apps/${APP_NAME}/releases`)
      .reply(200, [CURRENT])

    nock(API_HOST)
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
      ])

    const {stderr} = await runCommand(['ps:wait', '--app', APP_NAME])

    expect(stderr).to.be.empty
  })

  it('waits for all dynos to be on latest release', async function () {
    sinon.stub(hux, 'wait').resolves()

    nock(API_HOST)
      .get(`/apps/${APP_NAME}/releases`)
      .reply(200, [CURRENT])

    nock(API_HOST)
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: PREVIOUS, state: 'up', type: 'web'},
        {release: CURRENT, state: 'up', type: 'web'},
      ])

    nock(API_HOST)
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'starting', type: 'web'},
        {release: CURRENT, state: 'up', type: 'web'},
      ])

    nock(API_HOST)
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
        {release: CURRENT, state: 'up', type: 'web'},
      ])

    const {stderr} = await runCommand(['ps:wait', '--app', APP_NAME])

    expect(stderr).to.contain('Waiting for every dyno to be running v23... 2 / 2, done')
  })

  it('ignores release process dynos', async function () {
    nock(API_HOST)
      .get(`/apps/${APP_NAME}/releases`)
      .reply(200, [CURRENT])

    nock(API_HOST)
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
        {release: PREVIOUS, state: 'up', type: 'release'},
      ])

    const {stderr} = await runCommand(['ps:wait', '--app', APP_NAME])

    expect(stderr).to.be.empty
  })

  it('ignores run dynos by default', async function () {
    nock(API_HOST)
      .get(`/apps/${APP_NAME}/releases`)
      .reply(200, [CURRENT])

    nock(API_HOST)
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
        {release: PREVIOUS, state: 'up', type: 'run'},
      ])

    const {stderr} = await runCommand(['ps:wait', '--app', APP_NAME])

    expect(stderr).to.be.empty
  })

  it('includes run dynos with the --with-run flag', async function () {
    sinon.stub(hux, 'wait').resolves()

    nock(API_HOST)
      .get(`/apps/${APP_NAME}/releases`)
      .reply(200, [CURRENT])

    nock(API_HOST)
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
        {release: PREVIOUS, state: 'up', type: 'run'},
      ])

    nock(API_HOST)
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
        {release: CURRENT, state: 'up', type: 'run'},
      ])

    const {stderr} = await runCommand(['ps:wait', '--with-run', '--app', APP_NAME])

    expect(stderr).to.contain('Waiting for every dyno to be running v23... 2 / 2, done')
  })

  it('waits only for dynos of specific type with the --type flag', async function () {
    nock(API_HOST)
      .get(`/apps/${APP_NAME}/releases`)
      .reply(200, [CURRENT])

    nock(API_HOST)
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'worker'},
        {release: PREVIOUS, state: 'up', type: 'web'},
      ])

    const {stderr} = await runCommand(['ps:wait', '--type=worker', '--app', APP_NAME])

    expect(stderr).to.be.empty
  })
})
