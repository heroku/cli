import {expect, test} from '@oclif/test'

describe('pipelines:diff', function () {
  const apiUrl = 'https://api.heroku.com'
  const kolkrabbiApi = 'https://kolkrabbi.heroku.com'
  const githubApi = 'https://api.github.com'

  const pipeline = {
    id: '123-pipeline-456',
    name: 'example-pipeline',
  }

  const targetApp = {
    id: '123-target-app-456',
    name: 'example-staging',
    pipeline,
  }

  const targetCoupling = {
    app: targetApp,
    id: '123-target-app-456',
    pipeline,
    stage: 'staging',
  }

  const targetGithubApp = {
    repo: 'heroku/example-app',
  }

  const downstreamApp1 = {
    id: '123-downstream-app-1-456',
    name: 'example-production-eu',
    pipeline,
  }

  const downstreamCoupling1 = {
    app: downstreamApp1,
    id: '123-target-app-456',
    pipeline,
    stage: 'production',
  }

  const downstreamApp1Github = {
    repo: 'heroku/example-app',
  }

  const downstreamApp2 = {
    id: '123-downstream-app-2-456',
    name: 'example-production-us',
    pipeline,
  }

  const downstreamCoupling2 = {
    app: downstreamApp2,
    id: '123-target-app-456',
    pipeline,
    stage: 'production',
  }

  const downstreamApp2Github = {
    repo: 'heroku/some-other-app',
  }

  function mockPipelineCoupling(testInstance: typeof test) {
    return testInstance
      .nock(apiUrl, api => {
        api
          .get(`/apps/${targetApp.name}/pipeline-couplings`)
          .reply(200, targetCoupling)
      })
  }

  function mockApps(testInstance: typeof test) {
    return testInstance
      .nock(apiUrl, api => {
        api
          .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
          .reply(200, [targetCoupling, downstreamCoupling1, downstreamCoupling2])

        api
          .post('/filters/apps')
          .reply(200, [targetApp, downstreamApp1, downstreamApp2])
      })
  }

  describe('for app without a pipeline', function () {
    test
      .nock(apiUrl, api => {
        api
          .get(`/apps/${targetApp.name}/pipeline-couplings`)
          .reply(404, {message: 'Not found.'})
      })
      .command(['pipelines:diff', `--app=${targetApp.name}`])
      .catch(error => {
        expect(error.message).to.contain('to be a part of any pipeline')
      })
      .it('should return an error')
  })

  describe('for app with a pipeline but no downstream apps', function () {
    mockPipelineCoupling(test)
      .nock(apiUrl, api => {
        api
          .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
          .reply(200, [targetCoupling])
          .post('/filters/apps')
          .reply(200, [targetApp])
      })
      .command(['pipelines:diff', `--app=${targetApp.name}`])
      .catch(error => {
        expect(error.message).to.contain('no downstream apps')
      })
      .it('should return an error')
  })

  describe('for invalid apps with a pipeline', function () {
    const mockedTest = (testInstance: typeof test) => {
      const t = mockPipelineCoupling(mockApps(testInstance))

      return t
        .stdout()
        .stderr()
        .nock(kolkrabbiApi, api => {
          api
            .get(`/apps/${downstreamApp1.id}/github`)
            .reply(200, downstreamApp1Github)
            .get(`/apps/${downstreamApp2.id}/github`)
            .reply(200, downstreamApp2Github)
        })
    }

    mockedTest(test)
      .nock(kolkrabbiApi, api => {
        api
          .get(`/apps/${targetApp.id}/github`)
          .reply(404, {message: 'Not found.'})
      })
      .command(['pipelines:diff', `--app=${targetApp.name}`])
      .catch(error => {
        expect(error.message).to.contain('connected to GitHub')
      })
      .it('should return an error if the target app is not connected to GitHub')

    mockedTest(test)
      .nock(kolkrabbiApi, api => {
        api
          .get(`/apps/${targetApp.id}/github`)
          .reply(200, targetGithubApp)
      })
      .command(['pipelines:diff', `--app=${targetApp.name}`])
      .catch(error => {
        expect(error.message).to.contain('No release was found')
      })
      .it('should return an error if the target app has a release with no slug')

    mockedTest(test)
      .nock(kolkrabbiApi, api => {
        api
          .get(`/apps/${targetApp.id}/github`)
          .reply(200, targetGithubApp)
      })
      .nock(apiUrl, api => {
        api
          .get(`/apps/${targetApp.id}/releases`)
          .reply(200, [])
      })
      .command(['pipelines:diff', `--app=${targetApp.name}`])
      .catch(error => {
        expect(error.message).to.contain('No release was found')
      })
      .it('should return an error if the target app has no release')
  })

  describe('for valid apps with a pipeline', function () {
    const targetSlugId = 'target-slug-id'
    const downstreamSlugId = 'downstream-slug-id'

    const mockedTest = (testInstance: typeof test) => {
      const t = mockPipelineCoupling(mockApps(testInstance))

      return t
        .nock(kolkrabbiApi, api => {
          api
            .get(`/apps/${targetApp.id}/github`)
            .reply(200, targetGithubApp)
            .get(`/apps/${downstreamApp1.id}/github`)
            .reply(200, downstreamApp1Github)
            .get(`/apps/${downstreamApp2.id}/github`)
            .reply(200, downstreamApp2Github)
            .get('/account/github/token')
            .reply(200, {github: {token: 'github-token'}})
        })
        .nock(apiUrl, api => {
          api
            .get(`/apps/${targetApp.id}/releases`)
            .reply(200, [{slug: {id: targetSlugId}, status: 'succeeded'}])
            .get(`/apps/${downstreamApp1.id}/releases`)
            .reply(200, [
              {status: 'failed'},
              {slug: {id: downstreamSlugId}, status: 'succeeded'},
            ])
        })
    }

    mockedTest(test)
      .stdout()
      .nock(apiUrl, api => {
        api
          .get(`/apps/${targetApp.id}/slugs/${targetSlugId}`)
          .reply(200, {commit: 'COMMIT-HASH'})
          .get(`/apps/${downstreamApp1.id}/slugs/${downstreamSlugId}`)
          .reply(200, {commit: 'COMMIT-HASH'})
      })
      .command(['pipelines:diff', `--app=${targetApp.name}`])
      .it('should not compare apps if update to date NOR if repo differs', ctx => {
        expect(ctx.stdout).to.contain(`⬢ ${targetApp.name} is up to date with ⬢ ${downstreamApp1.name}`)
        expect(ctx.stdout).to.contain(`⬢ ${targetApp.name} was not compared to ⬢ ${downstreamApp2.name}`)
      })

    const hashes = ['hash-1', 'hash-2']

    mockedTest(test)
      .stdout()
      .nock(apiUrl, api => {
        api
          .get(`/apps/${targetApp.id}/slugs/${targetSlugId}`)
          .reply(200, {commit: hashes[0]})
          .get(`/apps/${downstreamApp1.id}/slugs/${downstreamSlugId}`)
          .reply(200, {commit: hashes[1]})
      })
      .nock(githubApi, api => {
        api
          .get(`/repos/${targetGithubApp.repo}/compare/${hashes[1]}...${hashes[0]}`)
          .reply(404)
      })
      .command(['pipelines:diff', `--app=${targetApp.name}`])
      .it('should handle non-200 responses from GitHub', ctx => {
        expect(ctx.stdout).to.contain('unable to perform a diff')
      })
  })
})
