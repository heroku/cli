import {expect, test} from '@oclif/test'
import * as inquirer from 'inquirer'

describe('pipelines:add', () => {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com', api => {
      const coupling = {id: '0123', stage: 'production'}
      const pipeline = {id: '0123', name: 'example-pipeline'}
      const pipelines = [pipeline]

      api.post('/pipeline-couplings')
        .reply(201, coupling)

      api.get('/pipelines')
        .query(true)
        .reply(200, pipelines)
    })
    .command([
      'pipelines:add',
      '--app',
      'example-app',
      '--stage',
      'production',
      'example-pipeline',
    ])
    .it('adds a pipeline', ctx => {
      expect(ctx.stdout).to.equal('')
      expect(ctx.stderr).to.contain('Adding ⬢ example-app to example-pipeline pipeline as production... done')
    })

  test
    .stderr()
    .stdout()
  // this `stub` overrides the prompt function on
  // the inqurier package to simulate what would be
  // returned from answering if "development" was
  // selected by the user
    .stub(inquirer, 'prompt', function () {
    // eslint-disable-next-line prefer-rest-params
      const questions = arguments[0]
      if (questions[0].name === 'stage') {
        return Promise.resolve({stage: 'development'})
      }
    })
    .nock('https://api.heroku.com', api => {
      const coupling = {id: '0123', stage: 'development'}
      const pipeline = {id: '0123', name: 'example-pipeline'}
      const pipelines = [pipeline]

      api.post('/pipeline-couplings')
        .reply(201, coupling)

      api.get('/pipelines')
        .query(true)
        .reply(200, pipelines)
    })
    .command([
      'pipelines:add',
      '--app',
      'example-app',
      'example-pipeline',
    ])
    .it('adds a pipeline with stage specified from prompt', ctx => {
      expect(ctx.stdout).to.equal('')
      expect(ctx.stderr).to.contain('Adding ⬢ example-app to example-pipeline pipeline as development... done')
    })

  test
    .stderr()
    .stdout()
  // this `stub` overrides the prompt function,
  // similuating that the user picked the identical
  // pipeline value with id: '0987' for the pipeline
  // question
    .stub(inquirer, 'prompt', function () {
    // eslint-disable-next-line prefer-rest-params
      const question = arguments[0][0]

      if (question && question.name === 'pipeline') {
        return Promise.resolve({pipeline: {
          name: 'pipeline-with-identical-name-to-another-pipeline',
          id: '0987',
        }})
      }

      return {}
    })
    .nock('https://api.heroku.com', api => {
      const coupling = {id: '0123', stage: 'development'}

      const firstIdenticallyNamedPipeline = {id: '0123', name: 'pipeline-with-identical-name-to-another-pipeline'}
      const secondIdenticallyNamedPipeline = {id: '0987', name: 'pipeline-with-identical-name-to-another-pipeline'}

      // by returning to a query for pipeline names with
      // multiple results we trigger a choice from the
      // user to disambigute between the choices
      const pipelinesWithIdenticalNames = [
        firstIdenticallyNamedPipeline,
        secondIdenticallyNamedPipeline,
      ]

      api.post('/pipeline-couplings')
        .reply(201, coupling)

      api.get('/pipelines')
        .query({eq: {name: 'pipeline-with-identical-name-to-another-pipeline'}})
        .reply(200, pipelinesWithIdenticalNames)
    })
    .command([
      'pipelines:add',
      '--app',
      'example-app',
      '--stage',
      'staging',
      'pipeline-with-identical-name-to-another-pipeline',
    ])
    .it('adds a pipeline by disambiguating by user choice of identically named pipelines', ctx => {
      expect(ctx.stdout).to.equal('')
      expect(ctx.stderr).to.contain('Adding ⬢ example-app to pipeline-with-identical-name-to-another-pipeline pipeline as staging... done')
    })
})
