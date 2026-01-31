import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('pipelines:connect', function () {
  let api: nock.Scope
  let kolkrabbiApi: nock.Scope
  let githubApi: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    kolkrabbiApi = nock('https://kolkrabbi.heroku.com')
    githubApi = nock('https://api.github.com')
  })

  afterEach(function () {
    api.done()
    kolkrabbiApi.done()
    githubApi.done()
    nock.cleanAll()
  })

  describe('when the user is not linked to GitHub', function () {
    it('displays an error', async function () {
      kolkrabbiApi
        .get('/account/github/token')
        .reply(401, {})

      const {error} = await runCommand(['pipelines:connect', 'my-pipeline', '--repo=my-org/my-repo'])

      expect(error?.message).to.equal('Account not connected to GitHub.')
    })
  })

  describe('with an account connected to GitHub', function () {
    it('shows success', async function () {
      const kolkrabbiAccount = {
        github: {
          token: '123-abc',
        },
      }
      const pipeline = {
        id: 123,
        name: 'my-pipeline',
      }

      kolkrabbiApi
        .get('/account/github/token')
        .reply(200, kolkrabbiAccount)
        .post(`/pipelines/${pipeline.id}/repository`)
        .reply(201, {})

      const repo = {
        default_branch: 'main',
        id: 1235,
        name: 'my-org/my-repo',
      }

      githubApi
        .get(`/repos/${repo.name}`)
        .reply(200, {repo})

      api
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, {
          id: pipeline.id,
          name: pipeline.name,
        })

      const {stderr, stdout} = await runCommand(['pipelines:connect', 'my-pipeline', '--repo=my-org/my-repo'])

      expect(stderr).to.include('Linking to repo...')
      expect(stdout).to.equal('')
    })
  })

  describe('with an account connected to GitHub experiencing request failures', function () {
    it('shows an error if GitHub request fails', async function () {
      const kolkrabbiAccount = {
        github: {
          token: '123-abc',
        },
      }

      kolkrabbiApi
        .get('/account/github/token')
        .reply(200, kolkrabbiAccount)

      const repo = {
        default_branch: 'main',
        id: 1235,
        name: 'my-org/my-repo',
      }

      githubApi
        .get(`/repos/${repo.name}`)
        .reply(401, {})

      const {error} = await runCommand(['pipelines:connect', 'my-pipeline', '--repo=my-org/my-repo'])

      expect(error?.message).to.contain('Could not access the my-org/my-repo repo')
    })
  })
})
