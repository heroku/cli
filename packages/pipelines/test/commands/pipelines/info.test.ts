import {expect, test} from '@oclif/test'

describe('pipelines:info', () => {
  let pipelines, couplings: any , apps: any , api: any, pipeline: any, stage

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

  function setup(owner: any) {
    pipeline = {name: 'example', id: '0123', owner}

    if (owner && owner.type === 'team') {
      api.get(`/teams/${owner.id}`).reply(200, {
        id: owner.id,
        name: 'my-team'
      })
    }

    pipelines = [pipeline]

    apps = []
    couplings = []

          // Build couplings
    appNames.forEach((name, id) => {
      stage = name.split('-')[0]
      couplings.push({
        stage,
        app: {id: `app-${id + 1}`}
      })
    })

          // Build apps
    appNames.forEach((name, id) => {
      apps.push(
        {
          id: `app-${id + 1}`,
          name,
          pipeline,
          owner: {id: '1234', email: 'foo@user.com'}
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

  function itShowsPipelineApps(ctx: any) {
    expect(ctx.stderr).to.include('=== example')
    appNames.forEach(name => {
      expect(ctx.stderr).to.include(name)
    })
    expect(ctx.stderr).to.include(`
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
  }

  test
    .stderr()
    .stdout()
    // .nock('https://api.heroku.com', api => {

    // })
    .command(['pipelines:info', 'example'])
    .it('displays the pipeline info and apps', ctx => {
      itShowsPipelineApps(ctx)
    })
})
