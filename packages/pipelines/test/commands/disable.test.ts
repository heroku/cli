import {expect, test} from '@oclif/test'

describe('reviewapps:disable', () => {
  const pipeline = {
    id: '123-pipeline',
    name: 'my-pipeline'
  }

  const app = {
    id: '123-app',
    name: 'my-app'
  }

  describe('with repos api enabled', () => {
    const feature = {
      name: 'dashboard-repositories-api',
      enabled: true
    }

    const repo = {
      full_name: 'james/repo'
    }

    describe('with review apps 1.0', () => {
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
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api.patch(`/apps/${app.id}/github`).reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api.get(`/apps/${app.name}`).reply(200, app)
      })
      .stderr()
      .stdout()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, `--app=${app.name}`])
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
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api.patch(`/apps/${app.id}/github`).reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api.get(`/apps/${app.name}`).reply(200, app)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy', `--app=${app.name}`])
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
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api.patch(`/apps/${app.id}/github`).reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api.get(`/apps/${app.name}`).reply(200, app)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodestroy', `--app=${app.name}`])
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
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api.patch(`/apps/${app.id}/github`).reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api.get(`/apps/${app.name}`).reply(200, app)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy', `--app=${app.name}`])
      .it('disables autodeploy and autodestroy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto deployment')
        expect(ctx.stdout).to.include('Disabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
    })

    describe('with review apps 2.0', () => {
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
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--beta'])
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
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy', '--beta'])
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
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodestroy', '--beta'])
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
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy', '--beta'])
      .it('disables autodeploy and autodestroy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto deployment')
        expect(ctx.stdout).to.include('Disabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
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

    describe('with review apps 1.0', () => {
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
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api.patch(`/apps/${app.id}/github`).reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api.get(`/apps/${app.name}`).reply(200, app)
      })
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, `--app=${app.name}`])
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
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api.patch(`/apps/${app.id}/github`).reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api.get(`/apps/${app.name}`).reply(200, app)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy', `--app=${app.name}`])
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
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api.patch(`/apps/${app.id}/github`).reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api.get(`/apps/${app.name}`).reply(200, app)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodestroy', `--app=${app.name}`])
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
      })
      .nock('https://kolkrabbi.heroku.com', api => {
        api.patch(`/apps/${app.id}/github`).reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api.get(`/apps/${app.name}`).reply(200, app)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy', `--app=${app.name}`])
      .it('disables autodeploy and autodestroy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto deployment')
        expect(ctx.stdout).to.include('Disabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
    })

    describe('with review apps 2.0', () => {
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
          .delete(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--beta'])
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
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy', '--beta'])
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
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodestroy', '--beta'])
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
          .patch(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy', '--beta'])
      .it('disables autodeploy and autodestroy', ctx => {
        expect(ctx.stdout).to.include('Disabling auto deployment')
        expect(ctx.stdout).to.include('Disabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
    })
  })
})
