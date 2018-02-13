const cli = require('heroku-cli-util')
const nock = require('nock')
const sinon = require('sinon')
const inquirer = require('inquirer')
const expect = require('chai').expect
const cmd = require('../../../commands/pipelines/setup')

describe('pipelines:setup', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.disableNetConnect()
    sinon.stub(cli, 'open').returns(Promise.resolve())
  })

  afterEach(function () {
    nock.cleanAll()
    cli.open.restore()
  })

  it('errors if the user is not linked to GitHub', function * () {
    try {
      yield cmd.run({ args: {}, flags: {} })
    } catch (error) {
      expect(error.message).to.equal('Account not connected to GitHub.')
    }
  })

  context('with an account connected to GitHub', function () {
    let pipeline, repo, archiveURL, prodApp, stagingApp, kolkrabbiAccount
    let api, kolkrabbi, github, couplings

    function nockDone () {
      api.done()
      github.done()
      kolkrabbi.done()
    }

    function stubCI (args) {
      kolkrabbi.patch(`/pipelines/${pipeline.id}/repository`, args).reply(200)
    }

    beforeEach(function () {
      archiveURL = 'https://example.com/archive.tar.gz'
      kolkrabbiAccount = { github: { token: '123-abc' } }

      pipeline = { id: '123-pipeline', name: 'my-pipeline' }

      repo = { id: 123, default_branch: 'master', name: 'my-org/my-repo' }
      prodApp = { id: '123-prod-app', name: pipeline.name }
      stagingApp = { id: '123-staging-app', name: `${pipeline.name}-staging` }

      couplings = [
        { id: 1, stage: 'production', app: prodApp },
        { id: 2, stage: 'staging', app: stagingApp }
      ]

      kolkrabbi = nock('https://kolkrabbi.heroku.com')
      kolkrabbi.get('/account/github/token').reply(200, kolkrabbiAccount)
      kolkrabbi.post(`/pipelines/${pipeline.id}/repository`).reply(201, {})
      kolkrabbi.patch(`/apps/${stagingApp.id}/github`).reply(200, {})

      github = nock('https://api.github.com')

      sinon.stub(inquirer, 'prompt').resolves({
        name: pipeline.name,
        repo: repo.name,
        ci: true
      })
    })

    afterEach(function () {
      inquirer.prompt.restore()
    })

    context('when pipeline name is too long', function () {
      it('shows a warning', function* () {
        return cmd.run({
          app: 'myapp',
          args: {
            name: 'super-cali-fragilistic-expialidocious'
          },
          flags: {}
        }).then(() => {
          expect(cli.stdout).to.eq('')
          expect(cli.stderr).to.include('Please choose a pipeline name between 2 and 22 characters')
        })
      })
    })

    context('and pipeline name is valid', function () {
      beforeEach(function () {
        github.get(`/repos/${repo.name}`).reply(200, repo)
        github.get(`/repos/${repo.name}/tarball/${repo.default_branch}`).reply(301, '', {
          location: archiveURL
        })

        api = nock('https://api.heroku.com')
        api.post('/pipelines').reply(201, pipeline)
      })

      context('in a personal account', function () {
        beforeEach(function () {
          couplings.forEach(function (coupling) {
            api.post('/app-setups', {
              source_blob: { url: archiveURL },
              app: { name: coupling.app.name, personal: true },
              pipeline_coupling: { stage: coupling.stage, pipeline: pipeline.id }
            }).reply(201, { id: coupling.id, app: coupling.app })

            api.get(`/app-setups/${coupling.id}`).reply(200, { status: 'succeeded' })
          })

          api.get('/users/~').reply(200, { id: '1234-567' })
        })

        it('creates apps in the personal account with CI enabled', function* () {
          stubCI({ name: pipeline.name, repo: repo.name, ci: true })
          return cmd.run({ args: {}, flags: {} }).then(() => { nockDone() })
        })

        it('downcases capitalised pipeline names', function* () {
          stubCI({ name: pipeline.name, repo: repo.name, ci: true })

          return cmd.run({ args: { name: pipeline.name.toUpperCase() },
            flags: {} }).then(() => nockDone())
        })

        it('does not prompt for options with the -y flag', function* () {
          stubCI({ ci: true })
          return cmd.run({
            args: {
              name: pipeline.name.toUpperCase()
            },
            flags: {
              yes: true
            }
          }).then(() => {
            nockDone()
            expect(inquirer.prompt).not.to.have.beenCalled
          })
        })
      })

      context('in a team', function () {
        let team

        beforeEach(function () {
          team = 'test-org'

          couplings.forEach(function (coupling) {
            api.post('/app-setups', {
              source_blob: { url: archiveURL },
              app: { name: coupling.app.name, organization: team },
              pipeline_coupling: { stage: coupling.stage, pipeline: pipeline.id }
            }).reply(201, { id: coupling.id, app: coupling.app })

            api.get(`/app-setups/${coupling.id}`).reply(200, { status: 'succeeded' })
          })
          api.get('/teams/test-org').reply(200, { id: '89-0123-456' })
          stubCI({ name: pipeline.name, repo: repo.name, organization: team, ci: true })
        })

        it('creates apps in a team with CI enabled', function* () {
          return cmd.run({ args: {}, flags: { team } }).then(() => { nockDone() })
        })
      })
    })
  })
})
