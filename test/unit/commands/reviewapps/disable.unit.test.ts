import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('reviewapps:disable', function () {
  const pipeline = {
    id: '123-pipeline',
    name: 'my-pipeline',
  }

  afterEach(function () {
    nock.cleanAll()
  })

  describe('with repos api enabled', function () {
    const feature = {
      enabled: true,
      name: 'dashboard-repositories-api',
    }

    const repo = {
      full_name: 'james/repo',
    }

    it('succeeds with defaults', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(200, feature)
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .get(`/pipelines/${pipeline.id}/repo`)
        .reply(200, repo)
        .delete(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      const {stderr} = await runCommand(['reviewapps:disable', `--pipeline=${pipeline.name}`])

      expect(stderr).to.include('done\n')
    })

    it('disables autodeploy', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(200, feature)
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .get(`/pipelines/${pipeline.id}/repo`)
        .reply(200, repo)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      const {stderr, stdout} = await runCommand(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodeploy'])

      expect(stdout).to.include('Disabling auto deployment')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('disables autodestroy', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(200, feature)
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .get(`/pipelines/${pipeline.id}/repo`)
        .reply(200, repo)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      const {stderr, stdout} = await runCommand(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodestroy'])

      expect(stdout).to.include('Disabling auto destroy')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('disables wait-for-ci', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(200, feature)
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .get(`/pipelines/${pipeline.id}/repo`)
        .reply(200, repo)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      const {stderr, stdout} = await runCommand(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-wait-for-ci'])

      expect(stdout).to.include('Disabling wait for CI')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('disables autodeploy and autodestroy and wait-for-ci', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(200, feature)
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .get(`/pipelines/${pipeline.id}/repo`)
        .reply(200, repo)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      const {stderr, stdout} = await runCommand(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodeploy', '--no-autodestroy', '--no-wait-for-ci'])

      expect(stdout).to.include('Disabling auto deployment')
      expect(stdout).to.include('Disabling auto destroy')
      expect(stdout).to.include('Disabling wait for CI')
      expect(stderr).to.include('Configuring pipeline')
    })
  })

  describe('with repos api disabled', function () {
    const feature = {
      enabled: false,
      name: 'dashboard-repositories-api',
    }

    const repo = {
      repository: {
        name: 'james/repo',
      },
    }

    it('succeeds with defaults', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(404, {})
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .delete(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      nock('https://kolkrabbi.heroku.com')
        .get(`/pipelines/${pipeline.id}/repository`)
        .reply(200, repo)

      const {stderr} = await runCommand(['reviewapps:disable', `--pipeline=${pipeline.name}`])

      expect(stderr).to.include('Configuring pipeline')
    })

    it('disables autodeploy', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(404, {})
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      nock('https://kolkrabbi.heroku.com')
        .get(`/pipelines/${pipeline.id}/repository`)
        .reply(200, repo)

      const {stderr, stdout} = await runCommand(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodeploy'])

      expect(stdout).to.include('Disabling auto deployment')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('disables autodestroy', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(404, {})
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      nock('https://kolkrabbi.heroku.com')
        .get(`/pipelines/${pipeline.id}/repository`)
        .reply(200, repo)

      const {stderr, stdout} = await runCommand(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodestroy'])

      expect(stdout).to.include('Disabling auto destroy')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('disables wait-for-ci', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(404, {})
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      nock('https://kolkrabbi.heroku.com')
        .get(`/pipelines/${pipeline.id}/repository`)
        .reply(200, repo)

      const {stderr, stdout} = await runCommand(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-wait-for-ci'])

      expect(stdout).to.include('Disabling wait for CI')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('disables autodeploy and autodestroy and wait-for-ci', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(404, {})
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      nock('https://kolkrabbi.heroku.com')
        .get(`/pipelines/${pipeline.id}/repository`)
        .reply(200, repo)

      const {stderr, stdout} = await runCommand(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodeploy', '--no-autodestroy', '--no-wait-for-ci'])

      expect(stdout).to.include('Disabling auto deployment')
      expect(stdout).to.include('Disabling auto destroy')
      expect(stdout).to.include('Disabling wait for CI')
      expect(stderr).to.include('Configuring pipeline')
    })
  })
})
