import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import ReviewappsDisable from '../../../../src/commands/reviewapps/disable.js'

describe('reviewapps:disable', function () {
  const pipeline = {
    id: '123-pipeline',
    name: 'my-pipeline',
  }

  afterEach(function () {
    nock.cleanAll()
  })

  const repo = {
    full_name: 'james/repo',
  }

  it('succeeds with defaults', async function () {
    nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.name}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/repo`)
      .reply(200, repo)
      .delete(`/pipelines/${pipeline.id}/review-app-config`)
      .reply(200, {})

    const {stderr} = await runCommand(ReviewappsDisable, [`--pipeline=${pipeline.name}`])

    expect(stderr).to.include('done\n')
  })

  it('disables autodeploy', async function () {
    nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.name}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/repo`)
      .reply(200, repo)
      .patch(`/pipelines/${pipeline.id}/review-app-config`)
      .reply(200, {})

    const {stderr, stdout} = await runCommand(ReviewappsDisable, [`--pipeline=${pipeline.name}`, '--no-autodeploy'])

    expect(stdout).to.include('Disabling auto deployment')
    expect(stderr).to.include('Configuring pipeline')
  })

  it('disables autodestroy', async function () {
    nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.name}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/repo`)
      .reply(200, repo)
      .patch(`/pipelines/${pipeline.id}/review-app-config`)
      .reply(200, {})

    const {stderr, stdout} = await runCommand(ReviewappsDisable, [`--pipeline=${pipeline.name}`, '--no-autodestroy'])

    expect(stdout).to.include('Disabling auto destroy')
    expect(stderr).to.include('Configuring pipeline')
  })

  it('disables wait-for-ci', async function () {
    nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.name}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/repo`)
      .reply(200, repo)
      .patch(`/pipelines/${pipeline.id}/review-app-config`)
      .reply(200, {})

    const {stderr, stdout} = await runCommand(ReviewappsDisable, [`--pipeline=${pipeline.name}`, '--no-wait-for-ci'])

    expect(stdout).to.include('Disabling wait for CI')
    expect(stderr).to.include('Configuring pipeline')
  })

  it('disables autodeploy and autodestroy and wait-for-ci', async function () {
    nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.name}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/repo`)
      .reply(200, repo)
      .patch(`/pipelines/${pipeline.id}/review-app-config`)
      .reply(200, {})

    const {stderr, stdout} = await runCommand(ReviewappsDisable, [`--pipeline=${pipeline.name}`, '--no-autodeploy', '--no-autodestroy', '--no-wait-for-ci'])

    expect(stdout).to.include('Disabling auto deployment')
    expect(stdout).to.include('Disabling auto destroy')
    expect(stdout).to.include('Disabling wait for CI')
    expect(stderr).to.include('Configuring pipeline')
  })
})
