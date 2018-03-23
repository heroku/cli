const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const cmd = require('../../../commands/pipelines/connect')

describe('pipelines:connect', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.disableNetConnect()
  })

  afterEach(function () {
    if (!nock.isDone()) {
      this.test.error(new Error('Not all nock interceptors were used!'))
      nock.cleanAll()
    }
  })

  it('errors if the user is not linked to GitHub', function* () {
    try {
      yield cmd.run({
        args: {},
        flags: {}
      })
    } catch (error) {
      expect(error.message).to.equal('Account not connected to GitHub.')
    }
  })

  context('with an account connected to GitHub', function () {
    let pipeline, repo, kolkrabbiAccount, api, kolkrabbi, github

    beforeEach(function () {
      kolkrabbiAccount = {
        github: {
          token: '123-abc'
        }
      }

      pipeline = {
        id: 123,
        name: 'my-pipeline'
      }

      repo = {
        id: 1235,
        default_branch: 'master',
        name: 'my-org/my-repo'
      }

      kolkrabbi = nock('https://kolkrabbi.heroku.com')
      kolkrabbi.get('/account/github/token').reply(200, kolkrabbiAccount)
      kolkrabbi.post(`/pipelines/${pipeline.id}/repository`).reply(201, {})

      github = nock('https://api.github.com')
      github.get(`/repos/${repo.name}`).reply(200, {repo})

      api = nock('https://api.heroku.com')
      api.get(`/pipelines/${pipeline.name}`)
        .reply(200, {
          id: pipeline.id,
          name: pipeline.name
        })
    })

    it('shows success', function* () {
      return cmd.run({
        args: {
          name: pipeline.name
        },
        flags: {
          repo: repo.name
        }
      }).then(() => {
        expect(cli.stderr).to.include('Linking to repo...')
        expect(cli.stdout).to.equal('')
      })
    })
  })
})
