import Heroku from '@heroku-cli/schema'
import {expect, test} from '@oclif/test'
import cli from 'cli-ux'

import unwrap from '../unwrap'

describe('pipelines:info', () => {
  type Stage = 'test' | 'review' | 'development' | 'staging' | 'production'
  let stage: Stage
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
  let owner: any = null
  let pipeline = {name: 'example', id: '0123', owner}
  let pipelines = [pipeline]

  let apps: Array<Heroku.App> = []
  let couplings: Array<Heroku.PipelineCoupling> = []

          // Build couplings
  appNames.forEach((name, id) => {
    stage = name.split('-')[0] as Stage
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

  const addMocks = (testInstance: typeof test) => {
    return testInstance
      .nock('https://api.heroku.com', api => {
        api
          .get('/pipelines')
          .query(true)
          .reply(200, pipelines)
          .get('/pipelines/0123/pipeline-couplings')
          .reply(200, couplings)
          .post('/filters/apps')
          .reply(200, apps)

        if (owner && owner.type === 'team') {
          api.get(`/teams/${owner.id}`).reply(200, {
            id: owner.id,
            name: 'my-team'
          })
        }
      })
  }

  function itShowsPipelineApps(ctx: any) {
    expect(ctx.stdout).to.include('=== example')
    appNames.forEach(name => {
      expect(ctx.stdout).to.include(name)
    })
    expect(ctx.stdout).to.include(`
app name            stage       
⬢ development-app-1 development 
⬢ development-app-2 development 
⬢ review-app-1      review      
⬢ review-app-2      review      
⬢ review-app-3      review      
⬢ review-app-4      review      
⬢ staging-app-1     staging     
⬢ staging-app-2     staging     
⬢ production-app-1  production `)
  }

  function itShowsMixedOwnershipWarning(owner: any, ctx: any) {
    const warningMessage = ` ›   Warning: Some apps in this pipeline do not belong to ${owner}.
 ›
 ›   All apps in a pipeline must have the same owner as the pipeline owner.
 ›   Transfer these apps or change the pipeline owner in pipeline settings.
 ›   See https://devcenter.heroku.com/articles/pipeline-ownership-transition for more info.
`
    expect(unwrap(ctx.stderr)).to.contain(warningMessage)
  }

  function itDoesNotShowMixedOwnershipWarning(ctx: any) {
    const warningMessage = 'Some apps in this pipeline do not belong'
    expect(ctx.stderr).to.not.contain(warningMessage)
  }

  addMocks(test)
    .stderr()
    .stdout()
    // .nock('https://api.heroku.com', api => {

    // })
    .command(['pipelines:info', 'example'])
    .it('displays the pipeline info and apps', ctx => {
      itShowsPipelineApps(ctx)
    })

  describe("when pipeline doesn't have an owner", () => {
    addMocks(test)
      .stderr()
      .stderr()
      .command(['pipelines:info', 'example'])
      .it("doesn't display the owner", ctx => {
        expect(ctx.stderr).to.not.contain('owner: foo@user.com')
      })

    addMocks(test)
      .stderr()
      .stdout()
      .command(['pipelines:info', 'example', '--json'])
      .it('displays json format', ctx => {
        expect(JSON.parse(ctx.stdout).pipeline.name).to.equal('example')
        expect(JSON.parse(ctx.stdout).apps.length).to.equal(9)
      })
  })

  describe('when it has an owner', () => {
    owner = {id: '5678', type: 'user'}
    pipeline = {...pipeline, owner}
    pipelines = [pipeline]
    addMocks(test)
      .stderr()
      .stdout()
      .command(['pipelines:info', 'example'])
      .it('displays mixed ownership warning', ctx => {
        // console.log(pipeline)
        itShowsMixedOwnershipWarning(owner.id, ctx)
      })

  })

  // describe('testing', () => {
  //   owner = {id: '1234', type: 'user'}
  //   pipeline = {...pipeline, owner}
  //   pipelines = [pipeline]
  //   addMocks(test)
  //     .stderr()
  //     .stdout()
  //     .command(['pipelines:info', 'example'])
  //     .it(`doesn't display mixed ownership warning`, ctx => {
  //       itDoesNotShowMixedOwnershipWarning(ctx)
  //     })
  // })
})
