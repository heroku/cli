import { expect, test } from '@oclif/test'

describe('reviewapps:disable', function () {
  const pipeline = {
    id: '123-pipeline',
    name: 'my-pipeline'
  }

  const app = {
    id: '123-prod-app',
    name: pipeline.name
  }

  const testWithMocks = () => {
    return test
      .nock('https://kolkrabbi.heroku.com', api => {
        api.patch(`/apps/${app.id}/github`).reply(200, {})
      })
      .nock('https://api.heroku.com', api => {
        api.get(`/apps/${app.name}`).reply(200, app)
      })
  }

  testWithMocks()
    .stderr()
    .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, `--app=${app.name}`])
    .it('succeeds with defaults', ctx => {
      expect(ctx.stderr).to.include('Configuring pipeline')
    })

  testWithMocks()
    .stderr()
    .stdout()
    .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, `--app=${app.name}`, '--autodeploy'])
    .it('it disables autodeploys', ctx => {
      expect(ctx.stdout).to.include('Disabling auto deployment')
      expect(ctx.stderr).to.include('Configuring pipeline')
    })

  testWithMocks()
    .stderr()
    .stdout()
    .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, `--app=${app.name}`, '--autodestroy'])
    .it('it disables autodestroy', ctx => {
      expect(ctx.stdout).to.include('Disabling auto destroy')
      expect(ctx.stderr).to.include('Configuring pipeline')
    })

  testWithMocks()
    .stderr()
    .stdout()
    .command(['reviewapps:disable', `--pipeline=${pipeline.name}`, `--app=${app.name}`, '--autodestroy', '--autodeploy'])
    .it('it disables autodestroy and auto deploy', ctx => {
      expect(ctx.stdout).to.include('Disabling auto destroy')
      expect(ctx.stdout).to.include('Disabling auto deployment')
      expect(ctx.stderr).to.include('Configuring pipeline')
    })
})
