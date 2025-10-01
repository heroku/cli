import * as Heroku from '@heroku-cli/schema'
import {expect, FancyTypes, test} from '@oclif/test'

const appNames = [
  'development-app-1',
  'development-app-2',
  'review-app-1',
  'review-app-2',
  'review-app-3',
  'review-app-4',
  'staging-app-1',
  'staging-app-2',
  'production-app-1',
]

type Stage = 'test' | 'review' | 'development' | 'staging' | 'production'
type TestContext = FancyTypes.Context & { readonly stdout: string } & { readonly stderr: string }

function itShowsPipelineApps(ctx: TestContext) {
  expect(ctx.stdout).to.include('=== example')

  appNames.forEach(name => {
    expect(ctx.stdout).to.contain(name)
  })

  const expectedTable = [
    'app name            stage       \n',
    '⬢ development-app-1 development \n',
    '⬢ development-app-2 development \n',
    '⬢ review-app-1      review      \n',
    '⬢ review-app-2      review      \n',
    '⬢ review-app-3      review      \n',
    '⬢ review-app-4      review      \n',
    '⬢ staging-app-1     staging     \n',
    '⬢ staging-app-2     staging     \n',
    '⬢ production-app-1  production ',
  ]

  expectedTable.forEach(ln => {
    expect(ctx.stdout).to.contain(ln)
  })
}

function setup(testInstance: typeof test, owner?: Heroku.Account) {
  const pipeline = {name: 'example', id: '0123', owner}
  const pipelines = [pipeline]
  const apps: Array<Heroku.App> = []
  const couplings: Array<Heroku.PipelineCoupling> = []

  // Build couplings
  appNames.forEach((name, id) => {
    const stage: Stage = name.split('-')[0] as Stage
    couplings.push({
      stage,
      app: {id: `app-${id + 1}`},
    })
  })

  // Build apps
  appNames.forEach((name, id) => {
    apps.push(
      {
        id: `app-${id + 1}`,
        name,
        pipeline,
        owner: {id: '1234', email: 'foo@user.com'},
      },
    )
  })

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
          name: 'my-team',
        })
      }
    })
}

function itDoesNotShowMixedOwnershipWarning(ctx: TestContext) {
  const warningMessage = 'Some apps in this pipeline do not belong'
  expect(ctx.stderr).to.not.contain(warningMessage)
}

function itShowsMixedOwnershipWarning(owner: string, ctx: TestContext) {
  const warningMessage = [
    `Warning: Some apps in this pipeline do not belong to ${owner}.`,
    'All apps in a pipeline must have the same owner as the pipeline owner.',
    'Transfer these apps or change the pipeline owner in pipeline settings.',
    'See https://devcenter.heroku.com/articles/pipeline-ownership-transition',
    'for more info.',
  ]

  warningMessage.forEach(message => {
    expect(ctx.stderr).to.contain(message)
  })
}

describe('pipelines:info', function () {
  describe("when pipeline doesn't have an owner", function () {
    setup(test)
      .stdout()
      .stderr()
      .command(['pipelines:info', 'example'])
      .it('doesn\'t display the owner', ctx => {
        expect(ctx.stdout).to.not.contain('owner: foo@user.com')
      })

    // eslint-disable-next-line mocha/no-sibling-hooks
    setup(test)
      .stdout()
      .stderr()
      .command(['pipelines:info', 'example', '--json'])
      .it('displays json format', ctx => {
        expect(ctx.stdout).to.not.contain('owner: foo@user.com')
        const parsedOutput = JSON.parse(ctx.stdout)
        expect(parsedOutput.pipeline.name).to.equal('example')
        expect(parsedOutput.apps.length).to.equal(9)
      })
  })

  describe('when it has an owner', function () {
    describe('and type is user', function () {
      describe('with mixed pipeline ownership', function () {
        const pipelineOwner = {id: '5678', type: 'user'}

        setup(test, pipelineOwner)
          .stdout()
          .stderr()
          .command(['pipelines:info', 'example'])
          .retries(3)
          .it('shows uuid instead of email', ctx => {
            const warningMessage = 'Some apps in this pipeline do not belong'
            expect(ctx.stdout).to.not.contain(warningMessage)

            expect(ctx.stdout).to.include('owner: 5678')

            itShowsMixedOwnershipWarning('5678', ctx)
            itShowsPipelineApps(ctx)
          })
      })

      describe('with same pipeline ownership', function () {
        const pipelineOwner = {id: '1234', type: 'user'}

        setup(test, pipelineOwner)
          .stdout()
          .stderr()
          .command(['pipelines:info', 'example'])
          .it('displays the owner email', ctx => {
            expect(ctx.stdout).to.contain('owner: foo@user.com')

            itDoesNotShowMixedOwnershipWarning(ctx)
            itShowsPipelineApps(ctx)
          })
      })
    })

    describe('and type is team', function () {
      describe('with mixed pipeline ownership', function () {
        const pipelineOwner = {id: '5678', type: 'team'}

        setup(test, pipelineOwner)
          .stderr()
          .stdout()
          .command(['pipelines:info', 'example'])
          .it('displays the owner', ctx => {
            expect(ctx.stdout).to.contain('owner: my-team (team)')
            itShowsPipelineApps(ctx)
            itShowsMixedOwnershipWarning('my-team (team)', ctx)
          })
      })

      describe('with homogeneous ownership', function () {
        const pipelineOwner = {id: '1234', type: 'team'}

        setup(test, pipelineOwner)
          .stderr()
          .stdout()
          .command(['pipelines:info', 'example'])
          .it('displays the owner', ctx => {
            expect(ctx.stdout).to.contain('owner: my-team (team)')
            itShowsPipelineApps(ctx)
            itDoesNotShowMixedOwnershipWarning(ctx)
          })
      })
    })
  })
})
