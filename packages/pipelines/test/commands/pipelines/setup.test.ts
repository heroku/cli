import {expect, test} from '@oclif/test'
import {cli} from 'cli-ux'
import sinon from 'sinon'

describe.only('pipelines:setup', () => {
  test
  .nock('https://kolkrabbi.heroku.com', kolkrabbi => kolkrabbi.get('/account/github/token').replyWithError(''))
  .command(['pipelines:setup'])
  .catch(error => expect(error.message).to.equal('Account not connected to GitHub.'))
  .it('errors if the user is not linked to GitHub')

  context('with an account connected to GitHub', function () {
    const archiveURL = 'https://example.com/archive.tar.gz'
    const pipeline = {id: '123-pipeline', name: 'my-pipeline'}
    const repo = {id: 123, default_branch: 'master', name: 'my-org/my-repo'}
    const kolkrabbiAccount = {github: {token: '123-abc'}}
    const prodApp = {id: '123-prod-app', name: pipeline.name}
    const stagingApp = {id: '123-staging-app', name: `${pipeline.name}-staging`}

    function setupApiNock(api: any) {
      api
      .post('/pipelines')
      .reply(201, pipeline)
      .get('/users/~')
      .reply(200, {id: '1234-567'})

      const couplings = [{id: 1, stage: 'production', app: prodApp}, {id: 2, stage: 'staging', app: stagingApp}]

      couplings.forEach(coupling => {
        api
        .post('/app-setups', {
          source_blob: {url: archiveURL},
          app: {name: coupling.app.name, personal: true},
          pipeline_coupling: {stage: coupling.stage, pipeline: pipeline.id},
        })
        .reply(201, {id: coupling.id, app: coupling.app})

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
      test
      .command(['pipelines:setup', 'super-cali-fragilistic-expialidocious'])
      .catch(error =>
        expect(error.message).to.equal('Please choose a pipeline name between 2 and 22 characters long'),
      )
      .it('shows a warning')
    })

    context('and pipeline name is valid', function () {
      context('in a personal account', function () {
        const promptStub = sinon.stub()
        const confirmStub = sinon.stub()

        test
        .do(() => {
          promptStub.onFirstCall().resolves(pipeline.name)
          promptStub.onSecondCall().resolves(repo.name)

          confirmStub.resolves(true)
        })
        .stderr()
        .stdout()
        .nock('https://api.heroku.com', api => setupApiNock(api))
        .nock('https://api.github.com', github => github.get(`/repos/${repo.name}`).reply(200, repo))
        .nock('https://kolkrabbi.heroku.com', kolkrabbi => {
          setupKolkrabbiNock(kolkrabbi)

          kolkrabbi
          .patch(`/pipelines/${pipeline.id}/repository`, {
            ci: true,
          })
          .reply(200)
        })
        .stub(cli, 'prompt', () => promptStub)
        .stub(cli, 'confirm', () => confirmStub)
        .stub(cli, 'open', () => () => Promise.resolve())
        .command(['pipelines:setup'])
        .it('creates apps in the personal account with CI enabled')

        test
        .do(() => {
          promptStub.reset()
          promptStub.onFirstCall().resolves(repo.name)
        })
        .stderr()
        .stdout()
        .nock('https://api.heroku.com', api => setupApiNock(api))
        .nock('https://api.github.com', github => github.get(`/repos/${repo.name}`).reply(200, repo))
        .nock('https://kolkrabbi.heroku.com', kolkrabbi => {
          setupKolkrabbiNock(kolkrabbi)

          kolkrabbi
          .patch(`/pipelines/${pipeline.id}/repository`, {
            ci: true,
          })
          .reply(200)
        })
        .stub(cli, 'prompt', () => promptStub)
        .stub(cli, 'confirm', () => confirmStub)
        .stub(cli, 'open', () => () => Promise.resolve())
        .command(['pipelines:setup', pipeline.name.toUpperCase()])
        .it('downcases capitalised pipeline names')

        test
        .do(() => {
          confirmStub.resetHistory()
        })
        .stderr()
        .stdout()
        .nock('https://api.heroku.com', api => setupApiNock(api))
        .nock('https://api.github.com', github => github.get(`/repos/${repo.name}`).reply(200, repo))
        .nock('https://kolkrabbi.heroku.com', kolkrabbi => {
          setupKolkrabbiNock(kolkrabbi)

          kolkrabbi
          .patch(`/pipelines/${pipeline.id}/repository`, {
            ci: true,
          })
          .reply(200)
        })
        .stub(cli, 'confirm', () => confirmStub)
        .stub(cli, 'open', () => () => Promise.resolve())
        .command(['pipelines:setup', '--yes', pipeline.name, repo.name])
        .it('does not prompt for options with the -y flag', () => {
          // Since we're passing the `yes` flag here, we should always return default settings and
          // thus never actually call cli.prompt
          expect(confirmStub.called).to.be.false
        })
      })

      context('in a team', function () {
        const team = 'test-org'
        const promptStub = sinon.stub()
        const confirmStub = sinon.stub()

        test
        .do(() => {
          promptStub.onFirstCall().resolves(pipeline.name)
          promptStub.onSecondCall().resolves(repo.name)

          confirmStub.resolves(true)
        })
        .nock('https://api.heroku.com', api => {
          api.post('/pipelines').reply(201, pipeline)

          const couplings = [
            {id: 1, stage: 'production', app: prodApp},
            {id: 2, stage: 'staging', app: stagingApp},
          ]

          couplings.forEach(function (coupling) {
            api
            .post('/app-setups', {
              source_blob: {url: archiveURL},
              app: {name: coupling.app.name, organization: team},
              pipeline_coupling: {stage: coupling.stage, pipeline: pipeline.id},
            })
            .reply(201, {id: coupling.id, app: coupling.app})

            api.get(`/app-setups/${coupling.id}`).reply(200, {status: 'succeeded'})
          })

          api.get('/teams/test-org').reply(200, {id: '89-0123-456'})
        })
        .nock('https://api.github.com', github => github.get(`/repos/${repo.name}`).reply(200, repo))
        .nock('https://kolkrabbi.heroku.com', kolkrabbi => {
          setupKolkrabbiNock(kolkrabbi)

          kolkrabbi
          .patch(`/pipelines/${pipeline.id}/repository`, {
            organization: team,
            ci: true,
          })
          .reply(200)
        })
        .stub(cli, 'prompt', () => promptStub)
        .stub(cli, 'confirm', () => confirmStub)
        .stub(cli, 'open', () => () => Promise.resolve())
        .command(['pipelines:setup', '--team', team])
        .it('creates apps in a team with CI enabled')
      })
    })
  })
})
