import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import ReviewappsEnable from '../../../../src/commands/reviewapps/enable.js'

describe('reviewapps:enable', function () {
  const pipeline = {
    id: '123-pipeline',
    name: 'my-pipeline',
  }
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  const repo = {
    full_name: 'james/repo',
  }

  it('succeeds with defaults', async function () {
    api
      .get(`/pipelines/${pipeline.name}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/repo`)
      .reply(200, repo)
      .post(`/pipelines/${pipeline.id}/review-app-config`)
      .reply(200, {})

    const {stderr} = await runCommand(ReviewappsEnable, [`--pipeline=${pipeline.name}`])

    expect(stderr).to.include('Configuring pipeline')
  })

  it('succeeds with autodeploy', async function () {
    api
      .get(`/pipelines/${pipeline.name}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/repo`)
      .reply(200, repo)
      .patch(`/pipelines/${pipeline.id}/review-app-config`)
      .reply(200, {})

    const {stderr, stdout} = await runCommand(ReviewappsEnable, [`--pipeline=${pipeline.name}`, '--autodeploy'])

    expect(stdout).to.include('Enabling auto deployment')
    expect(stderr).to.include('Configuring pipeline')
  })

  it('it succeeds with autodestroy', async function () {
    api
      .get(`/pipelines/${pipeline.name}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/repo`)
      .reply(200, repo)
      .patch(`/pipelines/${pipeline.id}/review-app-config`)
      .reply(200, {})

    const {stderr, stdout} = await runCommand(ReviewappsEnable, [`--pipeline=${pipeline.name}`, '--autodestroy'])

    expect(stdout).to.include('Enabling auto destroy')
    expect(stderr).to.include('Configuring pipeline')
  })

  it('it succeeds with wait-for-ci', async function () {
    api
      .get(`/pipelines/${pipeline.name}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/repo`)
      .reply(200, repo)
      .patch(`/pipelines/${pipeline.id}/review-app-config`)
      .reply(200, {})

    const {stderr, stdout} = await runCommand(ReviewappsEnable, [`--pipeline=${pipeline.name}`, '--wait-for-ci'])

    expect(stdout).to.include('Enabling wait for CI')
    expect(stderr).to.include('Configuring pipeline')
  })

  it('it succeeds with autodeploy and autodestroy and wait-for-ci', async function () {
    api
      .get(`/pipelines/${pipeline.name}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/repo`)
      .reply(200, repo)
      .patch(`/pipelines/${pipeline.id}/review-app-config`)
      .reply(200, {})

    const {stderr, stdout} = await runCommand(ReviewappsEnable, [`--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy', '--wait-for-ci'])

    expect(stdout).to.include('Enabling auto deployment')
    expect(stdout).to.include('Enabling auto destroy')
    expect(stdout).to.include('Enabling wait for CI')
    expect(stderr).to.include('Configuring pipeline')
  })
})
