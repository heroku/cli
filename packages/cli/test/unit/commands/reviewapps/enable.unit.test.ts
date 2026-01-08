import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('reviewapps:enable', function () {
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
        .post(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      const {stderr} = await runCommand(['reviewapps:enable', `--pipeline=${pipeline.name}`])

      expect(stderr).to.include('Configuring pipeline')
    })

    it('succeeds with autodeploy', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(200, feature)
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .get(`/pipelines/${pipeline.id}/repo`)
        .reply(200, repo)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      const {stderr, stdout} = await runCommand(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodeploy'])

      expect(stdout).to.include('Enabling auto deployment')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('it succeeds with autodestroy', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(200, feature)
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .get(`/pipelines/${pipeline.id}/repo`)
        .reply(200, repo)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      const {stderr, stdout} = await runCommand(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodestroy'])

      expect(stdout).to.include('Enabling auto destroy')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('it succeeds with wait-for-ci', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(200, feature)
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .get(`/pipelines/${pipeline.id}/repo`)
        .reply(200, repo)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      const {stderr, stdout} = await runCommand(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--wait-for-ci'])

      expect(stdout).to.include('Enabling wait for CI')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('it succeeds with autodeploy and autodestroy and wait-for-ci', async function () {
      nock('https://api.heroku.com')
        .get(`/account/features/${feature.name}`)
        .reply(200, feature)
        .get(`/pipelines/${pipeline.name}`)
        .reply(200, pipeline)
        .get(`/pipelines/${pipeline.id}/repo`)
        .reply(200, repo)
        .patch(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      const {stderr, stdout} = await runCommand(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy', '--wait-for-ci'])

      expect(stdout).to.include('Enabling auto deployment')
      expect(stdout).to.include('Enabling auto destroy')
      expect(stdout).to.include('Enabling wait for CI')
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
        .post(`/pipelines/${pipeline.id}/review-app-config`)
        .reply(200, {})

      nock('https://kolkrabbi.heroku.com')
        .get(`/pipelines/${pipeline.id}/repository`)
        .reply(200, repo)

      const {stderr} = await runCommand(['reviewapps:enable', `--pipeline=${pipeline.name}`])

      expect(stderr).to.include('Configuring pipeline')
    })

    it('succeeds with autodeploy', async function () {
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

      const {stderr, stdout} = await runCommand(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodeploy'])

      expect(stdout).to.include('Enabling auto deployment')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('it succeeds with autodestroy', async function () {
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

      const {stderr, stdout} = await runCommand(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodestroy'])

      expect(stdout).to.include('Enabling auto destroy')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('it succeeds with wait-for-ci', async function () {
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

      const {stderr, stdout} = await runCommand(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--wait-for-ci'])

      expect(stdout).to.include('Enabling wait for CI')
      expect(stderr).to.include('Configuring pipeline')
    })

    it('it succeeds with autodeploy and autodestroy and wait-for-ci', async function () {
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

      const {stderr, stdout} = await runCommand(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy', '--wait-for-ci'])

      expect(stdout).to.include('Enabling auto deployment')
      expect(stdout).to.include('Enabling auto destroy')
      expect(stdout).to.include('Enabling wait for CI')
      expect(stderr).to.include('Configuring pipeline')
    })
  })
})
