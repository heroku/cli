const cli = require('heroku-cli-util')
const nock = require('nock')
const sinon = require('sinon')
const inquirer = require('inquirer')
const expect = require('chai').expect
const cmd = require('../../../commands/pipelines/setup')

describe('pipelines:setup', function () {
  beforeEach(function () {
    cli.mockConsole()
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
    let api, kolkrabbi, github

    beforeEach(function () {
      archiveURL = 'https://example.com/archive.tar.gz'
      kolkrabbiAccount = { github: { token: '123-abc' } }

      pipeline = {
        id: '123-pipeline',
        name: 'my-pipeline'
      }

      repo = {
        id: 123,
        default_branch: 'master',
        name: 'my-org/my-repo'
      }

      prodApp = {
        id: '123-prod-app',
        name: pipeline.name
      }

      stagingApp = {
        id: '123-staging-app',
        name: `${pipeline.name}-staging`
      }

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
        yield cmd.run({
          app: 'myapp',
          args: {
            name: 'super-cali-fragilistic-expialidocious'
          },
          flags: {}
        })
        expect(cli.stdout).to.eq('')
        expect(cli.stderr).to.include('Please choose a pipeline name between 2 and 22 characters')
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
          api.post('/app-setups', {
            source_blob: { url: archiveURL },
            app: { name: prodApp.name, personal: true },
            pipeline_coupling: { stage: 'production', pipeline: pipeline.id }
          }).reply(201, { id: 1, app: prodApp })

          api.post('/app-setups', {
            source_blob: { url: archiveURL },
            app: { name: stagingApp.name, personal: true },
            pipeline_coupling: { stage: 'staging', pipeline: pipeline.id }
          }).reply(201, { id: 2, app: stagingApp })

          api.get('/app-setups/1').reply(200, { status: 'succeeded' })
          api.get('/app-setups/2').reply(200, { status: 'succeeded' })

          api.get('/users/~').reply(200, { id: '1234-567' })
        })

        it('creates apps in the personal account', function* () {
          yield cmd.run({ args: {}, flags: {} })

          api.done()
          github.done()
          kolkrabbi.done()
        })

        it('enables ci if the user is flagged in', function* () {
          api.get('/account/features/ci').reply(200, { enabled: true })
          kolkrabbi.patch(`/pipelines/${pipeline.id}/repository`, {
            ci: true
          }).reply(200)

          yield cmd.run({ args: {}, flags: {} })

          api.done()
          github.done()
          kolkrabbi.done()
        })

        it('downcases capitalised pipeline names', function* () {
          yield cmd.run({ args: { name: pipeline.name.toUpperCase() }, flags: {} })

          api.done()
          github.done()
          kolkrabbi.done()
        })

        it('does not prompt for options with the -y flag', function* () {
          yield cmd.run({
            args: {
              name: pipeline.name.toUpperCase()
            },
            flags: {
              yes: true
            }
          })

          expect(inquirer.prompt).not.to.have.beenCalled
        })
      })

      context('in a team', function () {
        let team

        beforeEach(function () {
          team = 'test-org'

          api.post('/app-setups', {
            source_blob: { url: archiveURL },
            app: { name: prodApp.name, organization: team },
            pipeline_coupling: { pipeline: pipeline.id, stage: 'production' }
          }).reply(201, { id: 1, app: prodApp })

          api.post('/app-setups', {
            source_blob: { url: archiveURL },
            app: { name: stagingApp.name, organization: team },
            pipeline_coupling: { pipeline: pipeline.id, stage: 'staging' }
          }).reply(201, { id: 2, app: stagingApp })

          api.get('/app-setups/1').reply(200, { status: 'succeeded' })
          api.get('/app-setups/2').reply(200, { status: 'succeeded' })

          api.get('/teams/test-org').reply(200, { id: '89-0123-456' })
        })

        it('creates apps in a team', function* () {
          yield cmd.run({ args: {}, flags: { team } })

          api.done()
          github.done()
          kolkrabbi.done()
        })

        it('enables ci billed to the org if the user is flagged in', function* () {
          api.get('/account/features/ci').reply(200, { enabled: true })
          kolkrabbi.patch(`/pipelines/${pipeline.id}/repository`, {
            ci: true,
            organization: team
          }).reply(200)

          yield cmd.run({ args: {}, flags: { team } })

          api.done()
          github.done()
          kolkrabbi.done()
        })
      })
    })
  })
})
