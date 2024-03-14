import {expect, test} from '@oclif/test'

describe('reviewapps:disable', () => {
  const pipeline = {
    id: '123-pipeline',
    name: 'my-pipeline',
  }

  describe('with repos api enabled', () => {
    const feature = {
      name: 'dashboard-repositories-api',
      enabled: true,
    }

    const repo = {
      full_name: 'james/repo',
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
          .get(`/pipelines/${pipeline.id}/repo`)
          .reply(200, repo)
        api
          .delete(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stderr()
      .stdout()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`])
      .it('succeeds with defaults', ctx => {
        expect(ctx.stderr).to.include('done\n')
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
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodeploy'])
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
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodestroy'])
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
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-wait-for-ci'])
      .it('disables wait-for-ci', ctx => {
        expect(ctx.stdout).to.include('Disabling wait for CI')
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
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodeploy', '--no-autodestroy', '--no-wait-for-ci'])
      .it('disables autodeploy and autodestroy and wait-for-ci', ctx => {
        expect(ctx.stdout).to.include('Disabling auto deployment')
        expect(ctx.stdout).to.include('Disabling auto destroy')
        expect(ctx.stdout).to.include('Disabling wait for CI')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
  })

  describe('with repos api disabled', () => {
    const feature = {
      name: 'dashboard-repositories-api',
      enabled: false,
    }

    const repo = {
      repository: {
        name: 'james/repo',
      },
    }

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(404, {})

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .delete(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
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
          .reply(404, {})

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodeploy'])
      .it('disables autodeploy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto deployment')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(404, {})

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodestroy'])
      .it('disables autodestroy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(404, {})

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-wait-for-ci'])
      .it('disables wait-for-ci', ctx => {
        expect(ctx.stdout).to.include('Disabling wait for CI')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })

    test
      .nock('https://api.heroku.com', api => {
        api
          .get(`/account/features/${feature.name}`)
          .reply(404, {})

        api
          .get(`/pipelines/${pipeline.name}`)
          .reply(200, pipeline)
        api
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--no-autodeploy', '--no-autodestroy', '--no-wait-for-ci'])
      .it('disables autodeploy and autodestroy and wait-for-ci', ctx => {
        expect(ctx.stdout).to.include('Disabling auto deployment')
        expect(ctx.stdout).to.include('Disabling auto destroy')
        expect(ctx.stdout).to.include('Disabling wait for CI')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
  })
})
