/* eslint-disable max-nested-callbacks */
import {runCommand} from '@heroku-cli/test-utils'
import {color, hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'

import SetupCommand from '../../../../src/commands/pipelines/setup.js'

describe('pipelines:setup', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
    restore()
  })

  it('errors if the repo cannot be accessed', async function () {
    stub(SetupCommand, 'open').resolves()
    const promptStub = stub()
    promptStub.onFirstCall().resolves('my-pipeline')
    promptStub.onSecondCall().resolves('my-org/my-repo')
    stub(hux, 'prompt').callsFake(promptStub)
    stub(hux, 'confirm').callsFake(stub().resolves(true))

    api
      .get('/repos/my-org/my-repo')
      .reply(404, {})

    const {error} = await runCommand(SetupCommand, [])

    expect(error?.message).to.contain('Couldn\'t access that repo')
  })

  context('with an account connected to GitHub', function () {
    const archiveURL = 'https://example.com/archive.tar.gz'
    const pipeline = {id: '123-pipeline', name: 'my-pipeline'}
    const repo = {default_branch: 'main', full_name: 'my-org/my-repo', id: 123, name: 'my-repo'}
    const prodApp = {id: '123-prod-app', name: pipeline.name}
    const stagingApp = {id: '123-staging-app', name: `${pipeline.name}-staging`}

    function setupApiNock() {
      api
        .post('/pipelines')
        .reply(201, pipeline)
        .get('/users/~')
        .reply(200, {id: '1234-567'})

      const couplings = [{app: prodApp, id: 1, stage: 'production'}, {app: stagingApp, id: 2, stage: 'staging'}]

      for (const coupling of couplings) {
        api
          .post('/app-setups', {
            app: {name: coupling.app.name, personal: true},
            pipeline_coupling: {pipeline: pipeline.id, stage: coupling.stage},
            source_blob: {url: archiveURL},
          })
          .reply(201, {app: coupling.app, id: coupling.id})

        api.get(`/app-setups/${coupling.id}`).reply(200, {status: 'succeeded'})
      }

      return api
    }

    function setupRepoNock() {
      return api
        .get(`/repos/${repo.full_name}`)
        .reply(200, repo)
        .post(`/pipelines/${pipeline.id}/repo`, {repo_url: `https://github.com/${repo.full_name}`})
        .reply(201, {id: '123-repo'})
        .get(`/repos/${repo.full_name}/archives/${repo.default_branch}`)
        .reply(200, {archive_link: archiveURL})
        .post(`/pipelines/${pipeline.id}/review-app-config`, {
          automatic_review_apps: true,
          destroy_stale_apps: true,
          pipeline: pipeline.id,
          repo: repo.full_name,
          wait_for_ci: true,
        })
        .reply(201, {})
    }

    context('when pipeline name is too long', function () {
      it('shows a warning', async function () {
        const {error} = await runCommand(SetupCommand, ['super-cali-fragilistic-expialidocious'])

        expect(error?.message).to.equal('Please choose a pipeline name between 2 and 22 characters long')
      })
    })

    context('and pipeline name is valid', function () {
      context('in a personal account', function () {
        let promptStub: SinonStub
        let confirmStub: SinonStub

        beforeEach(function () {
          promptStub = stub()
          confirmStub = stub()
        })

        it('creates apps in the personal account', async function () {
          promptStub.onFirstCall().resolves(pipeline.name)
          promptStub.onSecondCall().resolves(repo.full_name)
          confirmStub.resolves(true)

          stub(hux, 'prompt').callsFake(promptStub)
          stub(hux, 'confirm').callsFake(confirmStub)
          stub(SetupCommand, 'open').resolves()

          setupApiNock()
          setupRepoNock()

          await runCommand(SetupCommand, [])

          expect(promptStub.calledTwice).to.be.true
          expect(confirmStub.called).to.be.true
        })

        it('downcases capitalized pipeline names', async function () {
          promptStub.reset()
          promptStub.onFirstCall().resolves(repo.full_name)
          confirmStub.resolves(true)

          stub(hux, 'prompt').callsFake(promptStub)
          stub(hux, 'confirm').callsFake(confirmStub)
          stub(SetupCommand, 'open').resolves()

          setupApiNock()
          setupRepoNock()

          await runCommand(SetupCommand, [pipeline.name.toUpperCase()])

          expect(promptStub.calledOnce).to.be.true
          expect(confirmStub.called).to.be.true
        })

        it('does not prompt for options with the -y flag', async function () {
          confirmStub.resetHistory()

          stub(hux, 'confirm').callsFake(confirmStub)
          stub(SetupCommand, 'open').resolves()

          setupApiNock()
          setupRepoNock()

          await runCommand(SetupCommand, ['--yes', pipeline.name, repo.full_name])

          // Since we're passing the `yes` flag here, we should always return default settings and
          // thus never actually call cli.prompt
          expect(confirmStub.called).to.be.false
        })
      })

      context('in a team', function () {
        let promptStub: SinonStub
        let confirmStub: SinonStub
        const team = 'test-org'

        beforeEach(function () {
          promptStub = stub()
          confirmStub = stub()
        })

        it('creates apps in a team', async function () {
          promptStub.onFirstCall().resolves(pipeline.name)
          promptStub.onSecondCall().resolves(repo.full_name)
          confirmStub.resolves(true)

          stub(hux, 'prompt').callsFake(promptStub)
          stub(hux, 'confirm').callsFake(confirmStub)
          stub(SetupCommand, 'open').resolves()

          api.post('/pipelines').reply(201, pipeline)

          const couplings = [
            {app: prodApp, id: 1, stage: 'production'},
            {app: stagingApp, id: 2, stage: 'staging'},
          ]

          for (const coupling of couplings) {
            api
              .post('/app-setups', {
                app: {name: coupling.app.name, organization: team},
                pipeline_coupling: {pipeline: pipeline.id, stage: coupling.stage},
                source_blob: {url: archiveURL},
              })
              .reply(201, {app: coupling.app, id: coupling.id})

            api.get(`/app-setups/${coupling.id}`).reply(200, {status: 'succeeded'})
          }

          api.get('/teams/test-org').reply(200, {id: '89-0123-456'})

          setupRepoNock()

          await runCommand(SetupCommand, ['--team', team])

          expect(promptStub.calledTwice).to.be.true
          expect(confirmStub.called).to.be.true
        })
      })

      context('when pollAppSetup status fails', function () {
        const team = 'test-org'
        let confirmStub: SinonStub

        beforeEach(function () {
          confirmStub = stub()
        })

        it('shows error if getAppSetup returns body with setup.status === failed', async function () {
          confirmStub.resolves(true)

          stub(hux, 'confirm').callsFake(confirmStub)
          stub(SetupCommand, 'open').resolves()

          api.post('/pipelines').reply(201, pipeline)

          const couplings = [
            {app: prodApp, id: 1, stage: 'production'},
            {app: stagingApp, id: 2, stage: 'staging'},
          ]

          for (const coupling of couplings) {
            api
              .post('/app-setups', {
                app: {name: coupling.app.name, organization: team},
                pipeline_coupling: {pipeline: pipeline.id, stage: coupling.stage},
                source_blob: {url: archiveURL},
              })
              .reply(201, {app: coupling.app, id: coupling.id})

            api.get(`/app-setups/${coupling.id}`).reply(200, {app: {name: 'my-pipeline'}, failure_message: 'status failed', status: 'failed'})
          }

          api.get('/teams/test-org').reply(200, {id: '89-0123-456'})

          api
            .get(`/repos/${repo.full_name}`)
            .reply(200, repo)
            .post(`/pipelines/${pipeline.id}/repo`, {repo_url: `https://github.com/${repo.full_name}`})
            .reply(201, {id: '123-repo'})
            .get(`/repos/${repo.full_name}/archives/${repo.default_branch}`)
            .reply(200, {archive_link: archiveURL})

          const {error} = await runCommand(SetupCommand, ['my-pipeline', 'my-org/my-repo', '--team', team])

          expect(error).to.exist
          expect(error?.message).to.contain(`Couldn't create application ${color.app('my-pipeline')}: status failed`)
        })
      })

      context('when pollAppSetup status times out', function () {
        const team = 'test-org'
        let confirmStub: SinonStub

        beforeEach(function () {
          confirmStub = stub()
        })

        it('shows error if getAppSetup times out', async function () {
          confirmStub.resolves(true)

          stub(hux, 'confirm').callsFake(confirmStub)
          stub(SetupCommand, 'open').resolves()

          api.post('/pipelines').reply(201, pipeline)

          const couplings = [
            {app: prodApp, id: 1, stage: 'production'},
            {app: stagingApp, id: 2, stage: 'staging'},
          ]

          for (const coupling of couplings) {
            api
              .post('/app-setups', {
                app: {name: coupling.app.name, organization: team},
                pipeline_coupling: {pipeline: pipeline.id, stage: coupling.stage},
                source_blob: {url: archiveURL},
              })
              .reply(201, {app: coupling.app, id: coupling.id})

            api.get(`/app-setups/${coupling.id}`).reply(200, {status: 'timedout'})
            api.get(`/app-setups/${coupling.id}`).reply(200, {app: {name: 'my-pipeline'}, failure_message: 'timedout', status: 'failed'})
          }

          api.get('/teams/test-org').reply(200, {id: '89-0123-456'})

          api
            .get(`/repos/${repo.full_name}`)
            .reply(200, repo)
            .post(`/pipelines/${pipeline.id}/repo`, {repo_url: `https://github.com/${repo.full_name}`})
            .reply(201, {id: '123-repo'})
            .get(`/repos/${repo.full_name}/archives/${repo.default_branch}`)
            .reply(200, {archive_link: archiveURL})

          const {error} = await runCommand(SetupCommand, ['my-pipeline', 'my-org/my-repo', '--team', team])

          expect(error).to.exist
          expect(error?.message).to.contain('timedout')
        })
      })
    })
  })
})
