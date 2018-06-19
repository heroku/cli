const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const cmd = require('../../../commands/review_apps/enable')

describe('reviewapps:enable', function () {
  let pipeline, app, kolkrabbiAccount
  let api, kolkrabbi

  beforeEach(function () {
    cli.mockConsole()
    nock.disableNetConnect()

    kolkrabbiAccount = {
      github: {
        token: '123-abc'
      }
    }

    pipeline = {
      id: '123-pipeline',
      name: 'my-pipeline'
    }

    app = {
      id: '123-prod-app',
      name: pipeline.name
    }

    kolkrabbi = nock('https://kolkrabbi.heroku.com')
    kolkrabbi.get('/account/github/token').reply(200, kolkrabbiAccount)
    kolkrabbi.patch(`/apps/${app.id}/github`).reply(200, {})

    api = nock('https://api.heroku.com')
    api.get(`/apps/${app.name}`).reply(200, app)
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('it succeeds with defaults', function* () {
    return cmd.run({
      flags: {
        pipeline: pipeline.name,
        app: app.name
      }
    }).then(() => {
      expect(cli.stderr).to.include('Configuring pipeline')
    })
  })

  it('it succeeds with autodeploy', function* () {
    return cmd.run({
      flags: {
        pipeline: pipeline.name,
        app: app.name,
        autodeploy: true
      }
    }).then(() => {
      expect(cli.stdout).to.include('Enabling auto deployment')
      expect(cli.stderr).to.include('Configuring pipeline')
    })
  })

  it('it succeeds with autodestroy', function* () {
    return cmd.run({
      flags: {
        pipeline: pipeline.name,
        app: app.name,
        autodestroy: true
      }
    }).then(() => {
      expect(cli.stdout).to.include('Enabling auto destroy')
      expect(cli.stderr).to.include('Configuring pipeline')
    })
  })

  it('it succeeds with autodeploy and autodestroy', function* () {
    return cmd.run({
      flags: {
        pipeline: pipeline.name,
        app: app.name,
        autodeploy: true,
        autodestroy: true
      }
    }).then(() => {
      expect(cli.stdout).to.include('Enabling auto deployment')
      expect(cli.stdout).to.include('Enabling auto destroy')
      expect(cli.stderr).to.include('Configuring pipeline')
    })
  })
})
