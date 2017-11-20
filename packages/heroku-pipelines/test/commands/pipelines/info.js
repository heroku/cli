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
        cli.stdout.should.contain('=== example')
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
      api.get(`/teams/${owner.id}`).reply(200, {
        id: owner.id,
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
      setup()
    })

    it(`doesn't display the owner`, function () {
      return cmd.run({ args: { pipeline: 'example' }, flags: {} }).then(() => {
        cli.stdout.should.not.contain('owner: foo@user.com')
      }).then(() => api.done())
    })

    it('displays json format', function () {
      return cmd.run({ args: { pipeline: 'example' }, flags: { json: true } })
      .then(() => {
        JSON.parse(cli.stdout).pipeline.name.should.eq('example')
        JSON.parse(cli.stdout).apps.length.should.eq(9)
      })
      .then(() => api.done())
    })

    itShowsPipelineApps()
  })

  context('when it has an owner', function () {
    function itShowsMixedOwnershipWarning (owner) {
      it('displays mixed ownership warning', function () {
        return cmd.run({ args: { pipeline: 'example' }, flags: {} }).then(() => {
          const warningMessage = ` ▸    Some apps in this pipeline do not belong to ${owner}.
 ▸    \n ▸    All apps in a pipeline must have the same owner as the pipeline owner.
 ▸    Transfer these apps or change the pipeline owner in pipeline settings.
 ▸    See https://devcenter.heroku.com/articles/pipeline-ownership-transition
 ▸    for more info.
`
          cli.stderr.should.contain(warningMessage)
        }).then(() => api.done())
      })
    }

    function itDoesNotShowMixedOwnershipWarning () {
      it(`doesn't display mixed ownership warning`, function () {
        return cmd.run({ args: { pipeline: 'example' }, flags: {} }).then(() => {
          const warningMessage = `Some apps in this pipeline do not belong`
          cli.stdout.should.not.contain(warningMessage)
        }).then(() => api.done())
      })
    }

    context('and type is user', function () {
      context('with mixed pipeline ownership ', function () {
        // id '5678' means pipeline owner doesn't own any of the pipeline apps
        const pipelineOwner = { id: '5678', type: 'user' }

        beforeEach(function () {
          setup(pipelineOwner)
        })

        it('shows uuid instead of email', function () {
          return cmd.run({ args: { pipeline: 'example' }, flags: {} }).then(() => {
            cli.stdout.should.contain('owner: 5678')
          }).then(() => api.done())
        })

        itShowsMixedOwnershipWarning('5678')
        itShowsPipelineApps()
      })

      context('with homogeneous ownership', function () {
        const pipelineOwner = { id: '1234', type: 'user' }

        beforeEach(function () {
          setup(pipelineOwner)
        })

        it('displays the owner email', function () {
          return cmd.run({ args: { pipeline: 'example' }, flags: {} }).then(() => {
            cli.stdout.should.contain('owner: foo@user.com')
          }).then(() => api.done())
        })

        itDoesNotShowMixedOwnershipWarning()
        itShowsPipelineApps()
      })
    })

    context('and type is team', function () {
      function itShowsTeamAsOwner () {
        it('displays the owner', function () {
          return cmd.run({ args: { pipeline: 'example' }, flags: {} }).then(() => {
            cli.stdout.should.contain('owner: my-team (team)')
          }).then(() => api.done())
        })
      }

      context('with mixed pipeline ownership', function () {
        const pipelineOwner = { id: '5678', type: 'team' }

        beforeEach(function () {
          setup(pipelineOwner)
        })

        itShowsTeamAsOwner()
        itShowsPipelineApps()
        itShowsMixedOwnershipWarning('my-team (team)')
      })

      context('with homogeneous ownership', function () {
        const pipelineOwner = { id: '1234', type: 'team' }

        beforeEach(function () {
          setup(pipelineOwner)
        })

        itShowsTeamAsOwner()
        itShowsPipelineApps()
        itDoesNotShowMixedOwnershipWarning()
      })
    })
  })
})
