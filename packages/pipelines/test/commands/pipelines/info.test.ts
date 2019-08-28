import {expect, test} from '@oclif/test'

describe('pipelines:info', () => {
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
  test
    .stderr()
    .stdout()
    // .nock('https://api.heroku.com', api => {

    // })
    .command(['pipelines:info', 'example'])
    .it('displays the pipeline info and apps', ctx => {
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
    })
})
