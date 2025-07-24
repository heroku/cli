import {expect, test} from '@oclif/test'

describe('reviewapps:enable', function () {
  const pipeline = {
    id: '123-pipeline',
    name: 'my-pipeline',
  }

  describe('with repos api enabled', function () {
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
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stderr()
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`])
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
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodeploy'])
      .it('succeeds with autodeploy', ctx => {
        expect(ctx.stdout).to.include('Enabling auto deployment')
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
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodestroy'])
      .it('it succeeds with autodestroy', ctx => {
        expect(ctx.stdout).to.include('Enabling auto destroy')
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
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--wait-for-ci'])
      .it('it succeeds with wait-for-ci', ctx => {
        expect(ctx.stdout).to.include('Enabling wait for CI')
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
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy', '--wait-for-ci'])
      .it('it succeeds with autodeploy and autodestroy and wait-for-ci', ctx => {
        expect(ctx.stdout).to.include('Enabling auto deployment')
        expect(ctx.stdout).to.include('Enabling auto destroy')
        expect(ctx.stdout).to.include('Enabling wait for CI')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
  })

  describe('with repos api disabled', function () {
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
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
      })
      .stderr()
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`])
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
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodeploy'])
      .it('succeeds with autodeploy', ctx => {
        expect(ctx.stdout).to.include('Enabling auto deployment')
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
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodestroy'])
      .it('it succeeds with autodestroy', ctx => {
        expect(ctx.stdout).to.include('Enabling auto destroy')
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
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--wait-for-ci'])
      .it('it succeeds with wait-for-ci', ctx => {
        expect(ctx.stdout).to.include('Enabling wait for CI')
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
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy', '--wait-for-ci'])
      .it('it succeeds with autodeploy and autodestroy and wait-for-ci', ctx => {
        expect(ctx.stdout).to.include('Enabling auto deployment')
        expect(ctx.stdout).to.include('Enabling auto destroy')
        expect(ctx.stdout).to.include('Enabling wait for CI')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
  })
})
