'use strict'

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/pipelines/info')

describe('pipelines:info', function () {
  let pipelines, couplings, apps, api, pipeline, stage

  const appNames = [
    'development-app-1',
    'development-app-2',
    'review-app-1',
    'review-app-2',
    'review-app-3',
    'review-app-4',
    'staging-app-1',
    'staging-app-2',
    'production-app-1'
  ]

  beforeEach(function () {
    cli.mockConsole()
    api = nock('https://api.heroku.com')
  })

  function itShowsPipelineApps () {
    it('displays the pipeline info and apps', function () {
      return cmd.run({ args: { pipeline: 'example' }, flags: {} }).then(() => {
        cli.stdout.should.contain('name:  example')
        appNames.forEach((name) => {
          cli.stdout.should.contain(name)
        })
      }).then(() => api.done())
    })

    it('shows all apps and stages in order', function () {
      return cmd.run({ args: { pipeline: 'example' }, flags: {} }).then(() => {
        cli.stdout.should.contain(`
app name           stage
─────────────────  ───────────
development-app-1  development
development-app-2  development
review-app-1       review
review-app-2       review
review-app-3       review
review-app-4       review
staging-app-1      staging
staging-app-2      staging
production-app-1   production`)
      }).then(() => api.done())
    })
  }

  function setup (owner = null) {
    pipeline = { name: 'example', id: '0123', owner }

    if (owner && owner.type === 'team') {
      api.get('/teams/1234').reply(200, {
        id: '1234',
        name: 'my-team'
      })
    }

    pipelines = [ pipeline ]

    apps = []
    couplings = []

    // Build couplings
    appNames.forEach((name, id) => {
      stage = name.split('-')[0]
      couplings.push({
        stage,
        app: { id: `app-${id + 1}` }
      })
    })

    // Build apps
    appNames.forEach((name, id) => {
      apps.push(
        {
          id: `app-${id + 1}`,
          name,
          pipeline: pipeline,
          owner: { id: '1234', email: 'foo@user.com' }
        }
      )
    })

    api
      .get('/pipelines')
      .query(true)
      .reply(200, pipelines)
      .get('/pipelines/0123/pipeline-couplings')
      .reply(200, couplings)
      .post('/filters/apps')
      .reply(200, apps)
  }

  context(`when pipeline doesn't have an owner`, function () {
    beforeEach(function () {
      pipeline = { name: 'example', id: '0123' }
      setup()
    })

    it(`doesn't display the owner`, function () {
      return cmd.run({ args: { pipeline: 'example' }, flags: {} }).then(() => {
        cli.stdout.should.not.contain('owner: foo@user.com')
      }).then(() => api.done())
    })

    it('displays json format', function () {
      return cmd.run({ args: { pipeline: 'example' }, flags: { json: true } })
      .then(() => JSON.parse(cli.stdout).pipeline.name.should.eq('example'))
      .then(() => api.done())
    })

    itShowsPipelineApps()
  })

  context('when it has an owner', function () {
    context('and type is user', function () {
      beforeEach(function () {
        setup(setup({ id: '1234', type: 'user' }))
      })
    })

    context('and type is team', function () {
      beforeEach(function () {
        setup({ id: '1234', type: 'team' })
      })

      it('displays the owner', function () {
        return cmd.run({ args: { pipeline: 'example' }, flags: {} }).then(() => {
          cli.stdout.should.contain('owner: my-team (team)')
        }).then(() => api.done())
      })

      itShowsPipelineApps()
    })
  })
})
