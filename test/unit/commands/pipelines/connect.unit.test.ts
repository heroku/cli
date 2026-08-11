import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import PipelinesConnect from '../../../../src/commands/pipelines/connect.js'

describe('pipelines:connect', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  describe('with an account connected to GitHub', function () {
    it('shows success', async function () {
      const pipeline = {
        id: 123,
        name: 'my-pipeline',
      }

      const repo = {
        default_branch: 'main',
        full_name: 'my-org/my-repo',
        id: 1235,
      }

      api
        .get(`/repos/${repo.full_name}`)
        .reply(200, repo)
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, {
          id: pipeline.id,
          name: pipeline.name,
        })
        .post(`/pipelines/${pipeline.id}/repo`, {repo_url: `https://github.com/${repo.full_name}`})
        .reply(201, {})

      const {stderr, stdout} = await runCommand(PipelinesConnect, ['my-pipeline', '--repo=my-org/my-repo'])

      expect(stderr).to.include('Linking to repo...')
      expect(stdout).to.equal('')
    })
  })

  describe('with an account connected to GitHub experiencing request failures', function () {
    it('shows an error if the repo request fails', async function () {
      const repo = {
        default_branch: 'main',
        full_name: 'my-org/my-repo',
        id: 1235,
      }

      api
        .get(`/repos/${repo.full_name}`)
        .reply(401, {})

      const {error} = await runCommand(PipelinesConnect, ['my-pipeline', '--repo=my-org/my-repo'])

      expect(error?.message).to.contain('Couldn\'t access that repo')
      expect(error?.message).not.to.contain(repo.full_name)
      expect((error as any)?.statusCode).to.equal(401)
    })
  })
})
