import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('pipelines:diff', function () {
  const pipelineWithGeneration = {
    generation: {name: 'cedar'},
  }

  const pipeline = {
    id: '123-pipeline-456',
    name: 'example-pipeline',
  }

  const firPipeline = {
    id: '123-pipeline-fir',
    name: 'example-pipeline',
  }

  const targetApp = {
    id: '123-target-app-456',
    name: 'example-staging',
    pipeline,
  }

  const targetFirApp = {
    id: '123-target-app-fir',
    name: 'example-staging',
    pipeline: firPipeline,
  }

  const targetCoupling = {
    app: targetApp,
    generation: 'cedar',
    id: '123-target-app-456',
    pipeline,
    stage: 'staging',
  }

  const targetFirCoupling = {
    app: targetFirApp,
    generation: 'fir',
    id: '123-target-app-fir',
    pipeline: firPipeline,
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

  const downstreamFirApp1 = {
    id: '123-downstream-app-1-fir',
    name: 'example-production-eu',
    pipeline: firPipeline,
  }

  const downstreamCoupling1 = {
    app: downstreamApp1,
    generation: 'cedar',
    id: '123-target-app-456',
    pipeline,
    stage: 'production',
  }

  const downstreamFirCoupling1 = {
    app: downstreamFirApp1,
    generation: 'fir',
    id: '123-target-app-fir',
    pipeline: firPipeline,
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

  const downstreamFirApp2 = {
    id: '123-downstream-app-2-fir',
    name: 'example-production-us',
    pipeline: firPipeline,
  }

  const downstreamCoupling2 = {
    app: downstreamApp2,
    generation: 'cedar',
    id: '123-target-app-456',
    pipeline,
    stage: 'production',
  }

  const downstreamFirCoupling2 = {
    app: downstreamFirApp2,
    generation: 'fir',
    id: '123-target-app-fir',
    pipeline: firPipeline,
    stage: 'production',
  }

  const downstreamApp2Github = {
    repo: 'heroku/some-other-app',
  }

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

  describe('for app without a pipeline', function () {
    it('should return an error', async function () {
      api
        .get(`/apps/${targetApp.name}/pipeline-couplings`)
        .reply(404, {message: 'Not found.'})

      const {error} = await runCommand(['pipelines:diff', `--app=${targetApp.name}`])

      expect(error?.message).to.contain('to be a part of any pipeline')
    })
  })

  describe('for app with a pipeline but no downstream apps', function () {
    it('should return an error', async function () {
      api
        .get(`/apps/${targetApp.name}/pipeline-couplings`)
        .reply(200, targetCoupling)
        .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
        .reply(200, [targetCoupling])
        .post('/filters/apps')
        .reply(200, [targetApp])
        .get(`/pipelines/${targetCoupling.pipeline.id}`)
        .reply(200, pipelineWithGeneration)

      const {error} = await runCommand(['pipelines:diff', `--app=${targetApp.name}`])

      expect(error?.message).to.contain('no downstream apps')
    })
  })

  describe('for invalid apps with a pipeline', function () {
    it('should return an error if the target app is not connected to GitHub', async function () {
      api
        .get(`/apps/${targetApp.name}/pipeline-couplings`)
        .reply(200, targetCoupling)
        .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
        .reply(200, [targetCoupling, downstreamCoupling1, downstreamCoupling2])
        .post('/filters/apps')
        .reply(200, [targetApp, downstreamApp1, downstreamApp2])
        .get(`/pipelines/${targetCoupling.pipeline.id}`)
        .reply(200, pipelineWithGeneration)

      kolkrabbiApi
        .get(`/apps/${targetApp.id}/github`)
        .reply(404, {message: 'Not found.'})
        .get(`/apps/${downstreamApp1.id}/github`)
        .reply(200, downstreamApp1Github)
        .get(`/apps/${downstreamApp2.id}/github`)
        .reply(200, downstreamApp2Github)

      const {error} = await runCommand(['pipelines:diff', `--app=${targetApp.name}`])

      expect(error?.message).to.contain('connected to GitHub')
    })

    it('should return an error if the target app has a release with no slug', async function () {
      api
        .get(`/apps/${targetApp.name}/pipeline-couplings`)
        .reply(200, targetCoupling)
        .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
        .reply(200, [targetCoupling, downstreamCoupling1, downstreamCoupling2])
        .post('/filters/apps')
        .reply(200, [targetApp, downstreamApp1, downstreamApp2])
        .get(`/pipelines/${targetCoupling.pipeline.id}`)
        .reply(200, pipelineWithGeneration)

      kolkrabbiApi
        .get(`/apps/${targetApp.id}/github`)
        .reply(200, targetGithubApp)
        .get(`/apps/${downstreamApp1.id}/github`)
        .reply(200, downstreamApp1Github)
        .get(`/apps/${downstreamApp2.id}/github`)
        .reply(200, downstreamApp2Github)

      const {error} = await runCommand(['pipelines:diff', `--app=${targetApp.name}`])

      expect(error?.message).to.contain('No release was found')
    })

    it('should return an error if the target app has no release', async function () {
      api
        .get(`/apps/${targetApp.name}/pipeline-couplings`)
        .reply(200, targetCoupling)
        .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
        .reply(200, [targetCoupling, downstreamCoupling1, downstreamCoupling2])
        .post('/filters/apps')
        .reply(200, [targetApp, downstreamApp1, downstreamApp2])
        .get(`/pipelines/${targetCoupling.pipeline.id}`)
        .reply(200, pipelineWithGeneration)
        .get(`/apps/${targetApp.id}/releases`)
        .reply(200, [])

      kolkrabbiApi
        .get(`/apps/${targetApp.id}/github`)
        .reply(200, targetGithubApp)
        .get(`/apps/${downstreamApp1.id}/github`)
        .reply(200, downstreamApp1Github)
        .get(`/apps/${downstreamApp2.id}/github`)
        .reply(200, downstreamApp2Github)

      const {error} = await runCommand(['pipelines:diff', `--app=${targetApp.name}`])

      expect(error?.message).to.contain('No release was found')
    })
  })

  describe('for valid Cedar apps with a pipeline', function () {
    const targetSlugId = 'target-slug-id'
    const downstreamSlugId = 'downstream-slug-id'

    it('should not compare apps if update to date NOR if repo differs', async function () {
      api
        .get(`/apps/${targetApp.name}/pipeline-couplings`)
        .reply(200, targetCoupling)
        .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
        .reply(200, [targetCoupling, downstreamCoupling1, downstreamCoupling2])
        .post('/filters/apps')
        .reply(200, [targetApp, downstreamApp1, downstreamApp2])
        .get(`/pipelines/${targetCoupling.pipeline.id}`)
        .reply(200, pipelineWithGeneration)
        .get(`/apps/${targetApp.id}/releases`)
        .reply(200, [{slug: {id: targetSlugId}, status: 'succeeded'}])
        .get(`/apps/${downstreamApp1.id}/releases`)
        .reply(200, [
          {status: 'failed'},
          {slug: {id: downstreamSlugId}, status: 'succeeded'},
        ])
        .get(`/apps/${targetApp.id}/slugs/${targetSlugId}`)
        .reply(200, {commit: 'COMMIT-HASH'})
        .get(`/apps/${downstreamApp1.id}/slugs/${downstreamSlugId}`)
        .reply(200, {commit: 'COMMIT-HASH'})

      kolkrabbiApi
        .get(`/apps/${targetApp.id}/github`)
        .reply(200, targetGithubApp)
        .get(`/apps/${downstreamApp1.id}/github`)
        .reply(200, downstreamApp1Github)
        .get(`/apps/${downstreamApp2.id}/github`)
        .reply(200, downstreamApp2Github)
        .get('/account/github/token')
        .reply(200, {github: {token: 'github-token'}})

      const {stdout} = await runCommand(['pipelines:diff', `--app=${targetApp.name}`])

      expect(stdout).to.contain(`⬢ ${targetApp.name} is up to date with ⬢ ${downstreamApp1.name}`)
      expect(stdout).to.contain(`⬢ ${targetApp.name} was not compared to ⬢ ${downstreamApp2.name}`)
    })

    it('should handle non-200 responses from GitHub', async function () {
      const hashes = ['hash-1', 'hash-2']

      api
        .get(`/apps/${targetApp.name}/pipeline-couplings`)
        .reply(200, targetCoupling)
        .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
        .reply(200, [targetCoupling, downstreamCoupling1, downstreamCoupling2])
        .post('/filters/apps')
        .reply(200, [targetApp, downstreamApp1, downstreamApp2])
        .get(`/pipelines/${targetCoupling.pipeline.id}`)
        .reply(200, pipelineWithGeneration)
        .get(`/apps/${targetApp.id}/releases`)
        .reply(200, [{slug: {id: targetSlugId}, status: 'succeeded'}])
        .get(`/apps/${downstreamApp1.id}/releases`)
        .reply(200, [
          {status: 'failed'},
          {slug: {id: downstreamSlugId}, status: 'succeeded'},
        ])
        .get(`/apps/${targetApp.id}/slugs/${targetSlugId}`)
        .reply(200, {commit: hashes[0]})
        .get(`/apps/${downstreamApp1.id}/slugs/${downstreamSlugId}`)
        .reply(200, {commit: hashes[1]})

      kolkrabbiApi
        .get(`/apps/${targetApp.id}/github`)
        .reply(200, targetGithubApp)
        .get(`/apps/${downstreamApp1.id}/github`)
        .reply(200, downstreamApp1Github)
        .get(`/apps/${downstreamApp2.id}/github`)
        .reply(200, downstreamApp2Github)
        .get('/account/github/token')
        .reply(200, {github: {token: 'github-token'}})

      githubApi
        .get(`/repos/${targetGithubApp.repo}/compare/${hashes[1]}...${hashes[0]}`)
        .reply(404)

      const {stdout} = await runCommand(['pipelines:diff', `--app=${targetApp.name}`])

      expect(stdout).to.contain('unable to perform a diff')
    })
  })

  describe('for valid Fir apps with a pipeline', function () {
    const targetOciImageId = 'oci-image-id'
    const downstreamOciImageId = 'downstream-oci-image-id'

    it('should not compare apps if update to date NOR if repo differs', async function () {
      api
        .get(`/apps/${targetFirApp.name}/pipeline-couplings`)
        .reply(200, targetFirCoupling)
        .get(`/pipelines/${firPipeline.id}/pipeline-couplings`)
        .reply(200, [targetFirCoupling, downstreamFirCoupling1, downstreamFirCoupling2])
        .post('/filters/apps')
        .reply(200, [targetFirApp, downstreamFirApp1, downstreamFirApp2])
        .get(`/pipelines/${targetFirCoupling.pipeline.id}`)
        .reply(200, {generation: {name: 'fir'}})
        .get(`/apps/${targetFirApp.id}/releases`)
        .reply(200, [{oci_image: {id: targetOciImageId}, status: 'succeeded'}])
        .get(`/apps/${downstreamFirApp1.id}/releases`)
        .reply(200, [
          {status: 'failed'},
          {oci_image: {id: downstreamOciImageId}, status: 'succeeded'},
        ])
        .get(`/apps/${targetFirApp.id}/oci-images/${targetOciImageId}`)
        .reply(200, [{commit: 'COMMIT-HASH'}])
        .get(`/apps/${downstreamFirApp1.id}/oci-images/${downstreamOciImageId}`)
        .reply(200, [{commit: 'COMMIT-HASH'}])

      kolkrabbiApi
        .get(`/apps/${targetFirApp.id}/github`)
        .reply(200, targetGithubApp)
        .get(`/apps/${downstreamFirApp1.id}/github`)
        .reply(200, downstreamApp1Github)
        .get(`/apps/${downstreamFirApp2.id}/github`)
        .reply(200, downstreamApp2Github)
        .get('/account/github/token')
        .reply(200, {github: {token: 'github-token'}})

      const {stdout} = await runCommand(['pipelines:diff', `--app=${targetFirApp.name}`])

      expect(stdout).to.contain(`⬢ ${targetApp.name} is up to date with ⬢ ${downstreamApp1.name}`)
      expect(stdout).to.contain(`⬢ ${targetApp.name} was not compared to ⬢ ${downstreamApp2.name}`)
    })

    it('should handle non-200 responses from GitHub', async function () {
      const hashes = ['hash-1', 'hash-2']

      api
        .get(`/apps/${targetFirApp.name}/pipeline-couplings`)
        .reply(200, targetFirCoupling)
        .get(`/pipelines/${firPipeline.id}/pipeline-couplings`)
        .reply(200, [targetFirCoupling, downstreamFirCoupling1, downstreamFirCoupling2])
        .post('/filters/apps')
        .reply(200, [targetFirApp, downstreamFirApp1, downstreamFirApp2])
        .get(`/pipelines/${targetFirCoupling.pipeline.id}`)
        .reply(200, {generation: {name: 'fir'}})
        .get(`/apps/${targetFirApp.id}/releases`)
        .reply(200, [{oci_image: {id: targetOciImageId}, status: 'succeeded'}])
        .get(`/apps/${downstreamFirApp1.id}/releases`)
        .reply(200, [
          {status: 'failed'},
          {oci_image: {id: downstreamOciImageId}, status: 'succeeded'},
        ])
        .get(`/apps/${targetFirApp.id}/oci-images/${targetOciImageId}`)
        .reply(200, [{commit: hashes[0]}])
        .get(`/apps/${downstreamFirApp1.id}/oci-images/${downstreamOciImageId}`)
        .reply(200, [{commit: hashes[1]}])

      kolkrabbiApi
        .get(`/apps/${targetFirApp.id}/github`)
        .reply(200, targetGithubApp)
        .get(`/apps/${downstreamFirApp1.id}/github`)
        .reply(200, downstreamApp1Github)
        .get(`/apps/${downstreamFirApp2.id}/github`)
        .reply(200, downstreamApp2Github)
        .get('/account/github/token')
        .reply(200, {github: {token: 'github-token'}})

      githubApi
        .get(`/repos/${targetGithubApp.repo}/compare/${hashes[1]}...${hashes[0]}`)
        .reply(404)

      const {stdout} = await runCommand(['pipelines:diff', `--app=${targetFirApp.name}`])

      expect(stdout).to.contain('unable to perform a diff')
    })
  })
})
