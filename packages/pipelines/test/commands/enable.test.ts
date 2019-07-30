import {expect, test} from '@oclif/test'
// tslint:disable-next-line:no-duplicate-imports

describe('reviewapps:enable', () => {
  const kolkrabbiAccount = {
    github: {
      token: '123-abc'
    }
  }

  const pipeline = {
    id: '123-pipeline',
    name: 'my-pipeline'
  }

  const app = {
    id: '123-prod-app',
    name: pipeline.name
  }

  test
    .nock('https://kolkrabbi.heroku.com', api => {
      api
        .patch(`/apps/${app.id}/github`)
        .reply(200, {})
    })
    .nock('https://api.heroku.com', api => {
      api
        .get(`/apps/${app.name}`)
        .reply(200, app)
    })
    .stderr()
    .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, `--app=${app.name}`])
    .it('succeeds with defaults', ctx => {
      expect(ctx.stderr).to.include('Configuring pipeline')
    })

    test
      .nock('https://kolkrabbi.heroku.com', api => {
        api
          .patch(`/apps/${app.id}/github`)
          .reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api
          .get(`/apps/${app.name}`)
          .reply(200, app)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, `--app=${app.name}`, '--autodeploy'])
      .it('succeeds with autodeploy', ctx => {
        expect(ctx.stdout).to.include('Enabling auto deployment')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })

    test
      .nock('https://kolkrabbi.heroku.com', api => {
        api
          .patch(`/apps/${app.id}/github`)
          .reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api
          .get(`/apps/${app.name}`)
          .reply(200, app)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, `--app=${app.name}`, '--autodestroy'])
      .it('it succeeds with autodestroy', ctx => {
        expect(ctx.stdout).to.include('Enabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })

    test
      .nock('https://kolkrabbi.heroku.com', api => {
        api
          .patch(`/apps/${app.id}/github`)
          .reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api
          .get(`/apps/${app.name}`)
          .reply(200, app)
      })
      .stdout()
      .stderr()
      .command(['reviewapps:enable', `--pipeline=${pipeline.name}`, `--app=${app.name}`, '--autodeploy', '--autodestroy'])
      .it('it succeeds with autodeploy and autodestroy', ctx => {
        expect(ctx.stdout).to.include('Enabling auto deployment')
        expect(ctx.stdout).to.include('Enabling auto destroy')
        expect(ctx.stderr).to.include('Configuring pipeline')
      })
  })
