import {expect, test} from '@oclif/test'
// tslint:disable-next-line:no-duplicate-imports

describe('reviewapps:_enable', () => {
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
      .command(['reviewapps:_enable', `--pipeline=${pipeline.name}`])
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
      .command(['reviewapps:_enable', `--pipeline=${pipeline.name}`, '--autodeploy'])
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
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:_enable', `--pipeline=${pipeline.name}`, '--autodestroy'])
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
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:_enable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy'])
      .it('it succeeds with autodeploy and autodestroy', ctx => {
        expect(ctx.stdout).to.include('Enabling auto deployment')
        expect(ctx.stdout).to.include('Enabling auto destroy')
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
      .command(['reviewapps:_enable', `--pipeline=${pipeline.name}`])
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
      .command(['reviewapps:_enable', `--pipeline=${pipeline.name}`, '--autodeploy'])
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
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
        api
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:_enable', `--pipeline=${pipeline.name}`, '--autodestroy'])
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
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, repo)
        api
          .post(`/pipelines/${pipeline.id}/review-app-config`)
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['reviewapps:_enable', `--pipeline=${pipeline.name}`, '--autodeploy', '--autodestroy'])
      .it('it succeeds with autodeploy and autodestroy', ctx => {
        expect(ctx.stdout).to.include('Enabling auto deployment')
        expect(ctx.stdout).to.include('Enabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
  })
})
