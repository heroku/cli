import {expect, test} from '@oclif/test'

describe('reviewapps:disable', () => {
  const pipeline = {
    id: '123-pipeline',
    name: 'my-pipeline'
  }

  describe('with repos api enabled', () => {
    const feature = {
      name: 'dashboard-repositories-api',
      enabled: true
    }

    const repo = {
      full_name: 'james/repo'
    }

    // this is a workaround to
    // a fancy-test & stdout mocking error
    // it mocks them & runs an empty test
    // then resets the mocks after the test
    // setting up correctly for the tests below
    test
      .stderr()
      .stdout()
      .it('passes', ctx => {
        expect(ctx.stderr).to.include('')
        expect(ctx.stdout).to.include('')
      })

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(200, feature)

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .get(`/pipelines/${pipeline.id}/repo`)
          .reply(200, repo)
        api
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stderr()
      .stdout()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`])
      .it('succeeds with defaults', ctx => {
        expect(ctx.stderr).to.include('Configuring pipeline')
      })

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(200, feature)

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .get(`/pipelines/${pipeline.id}/repo`)
          .reply(200, repo)
        api
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy'])
      .it('disables autodeploy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto deployment')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(200, feature)

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .get(`/pipelines/${pipeline.id}/repo`)
          .reply(200, repo)
        api
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodestroy'])
      .it('disables autodestroy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(200, feature)

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .get(`/pipelines/${pipeline.id}/repo`)
          .reply(200, repo)
        api
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy'])
      .it('disables autodeploy and autodestroy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto deployment')
        expect(ctx.stdout).to.include('Disabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
  })

  describe('with repos api disabled', () => {
    const feature = {
      name: 'dashboard-repositories-api',
      enabled: false
    }

    const repo = {
      repository: {
        name: 'james/repo'
      }
    }

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(200, feature)

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
        api
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`])
      .it('succeeds with defaults', ctx => {
        expect(ctx.stderr).to.include('Configuring pipeline')
      })

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(200, feature)

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
        api
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy'])
      .it('disables autodeploy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto deployment')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(200, feature)

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
        api
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodestroy'])
      .it('disables autodestroy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(200, feature)

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
        api
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy'])
      .it('disables autodeploy and autodestroy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto deployment')
        expect(ctx.stdout).to.include('Disabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
  })
})
