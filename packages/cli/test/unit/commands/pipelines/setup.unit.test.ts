import {hux} from '@heroku/heroku-cli-util'
import {color} from '@heroku-cli/color'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import SetupCommand from '../../../../src/commands/pipelines/setup.js'
import runCommandHelper from '../../../helpers/runCommand.js'

describe('pipelines:setup', function () {
  afterEach(function () {
    nock.cleanAll()
    sinon.restore()
  })

  it('errors if the user is not linked to GitHub', async function () {
    nock('https://kolkrabbi.heroku.com')
      .get('/account/github/token')
      .replyWithError('')

    const {error} = await runCommand(['pipelines:setup'])

    expect(error?.message).to.equal('Account not connected to GitHub.')
  })

  context('with an account connected to GitHub', function () {
    const archiveURL = 'https://example.com/archive.tar.gz'
    const pipeline = {id: '123-pipeline', name: 'my-pipeline'}
    const repo = {default_branch: 'main', id: 123, name: 'my-org/my-repo'}
    const kolkrabbiAccount = {github: {token: '123-abc'}}
    const prodApp = {id: '123-prod-app', name: pipeline.name}
    const stagingApp = {id: '123-staging-app', name: `${pipeline.name}-staging`}

    function setupApiNock(api: any) {
      api
        .post('/pipelines')
        .reply(201, pipeline)
        .get('/users/~')
        .reply(200, {id: '1234-567'})

      const couplings = [{app: prodApp, id: 1, stage: 'production'}, {app: stagingApp, id: 2, stage: 'staging'}]

      couplings.forEach(coupling => {
        api
          .post('/app-setups', {
            app: {name: coupling.app.name, personal: true},
            pipeline_coupling: {pipeline: pipeline.id, stage: coupling.stage},
            source_blob: {url: archiveURL},
          })
          .reply(201, {app: coupling.app, id: coupling.id})

        api.get(`/app-setups/${coupling.id}`).reply(200, {status: 'succeeded'})
      })

      return api
    }

    function setupKolkrabbiNock(kolkrabbi: any) {
      kolkrabbi
        .get('/account/github/token')
        .reply(200, kolkrabbiAccount)
        .get(`/github/repos/${repo.name}/tarball/${repo.default_branch}`)
        .reply(200, {
          archive_link: archiveURL,
        })
        .post(`/pipelines/${pipeline.id}/repository`)
        .reply(201, {})
        .patch(`/apps/${stagingApp.id}/github`)
        .reply(200, {})

      return kolkrabbi
    }

    context('when pipeline name is too long', function () {
      it('shows a warning', async function () {
        const {error} = await runCommand(['pipelines:setup', 'super-cali-fragilistic-expialidocious'])

        expect(error?.message).to.equal('Please choose a pipeline name between 2 and 22 characters long')
      })
    })

    context('and pipeline name is valid', function () {
      context('in a personal account', function () {
        const promptStub = sinon.stub()
        const confirmStub = sinon.stub()

        it('creates apps in the personal account with CI enabled', async function () {
          promptStub.onFirstCall().resolves(pipeline.name)
          promptStub.onSecondCall().resolves(repo.name)
          confirmStub.resolves(true)

          sinon.stub(hux, 'prompt').callsFake(promptStub)
          sinon.stub(hux, 'confirm').callsFake(confirmStub)
          sinon.stub(SetupCommand, 'open').resolves()

          setupApiNock(nock('https://api.heroku.com'))
          nock('https://api.github.com').get(`/repos/${repo.name}`).reply(200, repo)

          const kolkrabbi = setupKolkrabbiNock(nock('https://kolkrabbi.heroku.com'))
          kolkrabbi
            .patch(`/pipelines/${pipeline.id}/repository`, {
              ci: true,
            })
            .reply(200)

          await runCommandHelper(SetupCommand, [])

          expect(promptStub.calledTwice).to.be.true
          expect(confirmStub.called).to.be.true
        })

        it('downcases capitalized pipeline names', async function () {
          promptStub.reset()
          promptStub.onFirstCall().resolves(repo.name)
          confirmStub.resolves(true)

          sinon.stub(hux, 'prompt').callsFake(promptStub)
          sinon.stub(hux, 'confirm').callsFake(confirmStub)
          sinon.stub(SetupCommand, 'open').resolves()

          setupApiNock(nock('https://api.heroku.com'))
          nock('https://api.github.com').get(`/repos/${repo.name}`).reply(200, repo)

          const kolkrabbi = setupKolkrabbiNock(nock('https://kolkrabbi.heroku.com'))
          kolkrabbi
            .patch(`/pipelines/${pipeline.id}/repository`, {
              ci: true,
            })
            .reply(200)

          await runCommandHelper(SetupCommand, [pipeline.name.toUpperCase()])

          expect(promptStub.calledOnce).to.be.true
          expect(confirmStub.called).to.be.true
        })

        it('does not prompt for options with the -y flag', async function () {
          confirmStub.resetHistory()

          sinon.stub(hux, 'confirm').callsFake(confirmStub)
          sinon.stub(SetupCommand, 'open').resolves()

          setupApiNock(nock('https://api.heroku.com'))
          nock('https://api.github.com').get(`/repos/${repo.name}`).reply(200, repo)

          const kolkrabbi = setupKolkrabbiNock(nock('https://kolkrabbi.heroku.com'))
          kolkrabbi
            .patch(`/pipelines/${pipeline.id}/repository`, {
              ci: true,
            })
            .reply(200)

          await runCommandHelper(SetupCommand, ['--yes', pipeline.name, repo.name])

          // Since we're passing the `yes` flag here, we should always return default settings and
          // thus never actually call cli.prompt
          expect(confirmStub.called).to.be.false
        })
      })

      context('in a team', function () {
        const team = 'test-org'
        const promptStub = sinon.stub()
        const confirmStub = sinon.stub()

        it('creates apps in a team with CI enabled', async function () {
          promptStub.onFirstCall().resolves(pipeline.name)
          promptStub.onSecondCall().resolves(repo.name)
          confirmStub.resolves(true)

          sinon.stub(hux, 'prompt').callsFake(promptStub)
          sinon.stub(hux, 'confirm').callsFake(confirmStub)
          sinon.stub(SetupCommand, 'open').resolves()

          const api = nock('https://api.heroku.com')
          api.post('/pipelines').reply(201, pipeline)

          const couplings = [
            {app: prodApp, id: 1, stage: 'production'},
            {app: stagingApp, id: 2, stage: 'staging'},
          ]

          couplings.forEach(function (coupling) {
            api
              .post('/app-setups', {
                app: {name: coupling.app.name, organization: team},
                pipeline_coupling: {pipeline: pipeline.id, stage: coupling.stage},
                source_blob: {url: archiveURL},
              })
              .reply(201, {app: coupling.app, id: coupling.id})

            api.get(`/app-setups/${coupling.id}`).reply(200, {status: 'succeeded'})
          })

          api.get('/teams/test-org').reply(200, {id: '89-0123-456'})

          nock('https://api.github.com').get(`/repos/${repo.name}`).reply(200, repo)

          const kolkrabbi = setupKolkrabbiNock(nock('https://kolkrabbi.heroku.com'))
          kolkrabbi
            .patch(`/pipelines/${pipeline.id}/repository`, {
              ci: true,
              organization: team,
            })
            .reply(200)

          await runCommandHelper(SetupCommand, ['--team', team])

          expect(promptStub.calledTwice).to.be.true
          expect(confirmStub.called).to.be.true
        })
      })

      context('when pollAppSetup status fails', function () {
        const team = 'test-org'
        const confirmStub = sinon.stub()

        it('shows error if getAppSetup returns body with setup.status === failed', async function () {
          confirmStub.resolves(true)

          sinon.stub(hux, 'confirm').callsFake(confirmStub)
          sinon.stub(SetupCommand, 'open').resolves()

          const api = nock('https://api.heroku.com')
          api.post('/pipelines').reply(201, pipeline)

          const couplings = [
            {app: prodApp, id: 1, stage: 'production'},
            {app: stagingApp, id: 2, stage: 'staging'},
          ]

          couplings.forEach(function (coupling) {
            api
              .post('/app-setups', {
                app: {name: coupling.app.name, organization: team},
                pipeline_coupling: {pipeline: pipeline.id, stage: coupling.stage},
                source_blob: {url: archiveURL},
              })
              .reply(201, {app: coupling.app, id: coupling.id})

            api.get(`/app-setups/${coupling.id}`).reply(200, {app: {name: 'my-pipeline'}, failure_message: 'status failed', status: 'failed'})
          })

          api.get('/teams/test-org').reply(200, {id: '89-0123-456'})

          nock('https://api.github.com').get(`/repos/${repo.name}`).reply(200, repo)

          nock('https://kolkrabbi.heroku.com')
            .get('/account/github/token')
            .reply(200, kolkrabbiAccount)
            .get(`/github/repos/${repo.name}/tarball/${repo.default_branch}`)
            .reply(200, {
              archive_link: archiveURL,
            })
            .post(`/pipelines/${pipeline.id}/repository`)
            .reply(201, {})

          try {
            await runCommandHelper(SetupCommand, ['my-pipeline', 'my-org/my-repo', '--team', team])
            expect.fail('Expected command to throw error')
          } catch (error: any) {
            expect(error.message).to.contain(`Couldn't create application ${color.app('my-pipeline')}: status failed`)
          }
        })
      })

      context('when pollAppSetup status times out', function () {
        const team = 'test-org'
        const confirmStub = sinon.stub()

        it('shows error if getAppSetup times out', async function () {
          confirmStub.resolves(true)

          sinon.stub(hux, 'confirm').callsFake(confirmStub)
          sinon.stub(SetupCommand, 'open').resolves()

          const api = nock('https://api.heroku.com')
          api.post('/pipelines').reply(201, pipeline)

          const couplings = [
            {app: prodApp, id: 1, stage: 'production'},
            {app: stagingApp, id: 2, stage: 'staging'},
          ]

          couplings.forEach(function (coupling) {
            api
              .post('/app-setups', {
                app: {name: coupling.app.name, organization: team},
                pipeline_coupling: {pipeline: pipeline.id, stage: coupling.stage},
                source_blob: {url: archiveURL},
              })
              .reply(201, {app: coupling.app, id: coupling.id})

            api.get(`/app-setups/${coupling.id}`).reply(200, {status: 'timedout'})
            api.get(`/app-setups/${coupling.id}`).reply(200, {app: {name: 'my-pipeline'}, failure_message: 'timedout', status: 'failed'})
          })

          api.get('/teams/test-org').reply(200, {id: '89-0123-456'})

          nock('https://api.github.com').get(`/repos/${repo.name}`).reply(200, repo)

          nock('https://kolkrabbi.heroku.com')
            .get('/account/github/token')
            .reply(200, kolkrabbiAccount)
            .get(`/github/repos/${repo.name}/tarball/${repo.default_branch}`)
            .reply(200, {
              archive_link: archiveURL,
            })
            .post(`/pipelines/${pipeline.id}/repository`)
            .reply(201, {})

          try {
            await runCommandHelper(SetupCommand, ['my-pipeline', 'my-org/my-repo', '--team', team])
            expect.fail('Expected command to throw error')
          } catch (error: any) {
            expect(error.message).to.contain('timedout')
          }
        })
      })
    })
  })
})
