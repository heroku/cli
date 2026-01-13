import {expect} from 'chai'
import inquirer from 'inquirer'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'

import AddCommand from '../../../../src/commands/pipelines/add.js'
import runCommandHelper from '../../../helpers/runCommand.js'

describe('pipelines:add', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
  })

  it('adds a pipeline', async function () {
    const coupling = {id: '0123', stage: 'production'}
    const pipeline = {id: '0123', name: 'example-pipeline'}
    const pipelines = [pipeline]

    api
      .post('/pipeline-couplings')
      .reply(201, coupling)
      .get('/pipelines')
      .query(true)
      .reply(200, pipelines)

    await runCommandHelper(AddCommand, [
      '--app',
      'example-app',
      '--stage',
      'production',
      'example-pipeline',
    ])

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.contain('Adding ⬢ example-app to example-pipeline pipeline as production... done')
  })

  it('adds a pipeline with stage specified from prompt', async function () {
    // this `stub` overrides the prompt function on
    // the inquirer package to simulate what would be
    // returned from answering if "development" was
    // selected by the user
    sinon.stub(inquirer, 'prompt').callsFake(function (questions: any) {
      if (questions[0].name === 'stage') {
        return Promise.resolve({stage: 'development'})
      }

      return Promise.resolve({})
    })

    const coupling = {id: '0123', stage: 'development'}
    const pipeline = {id: '0123', name: 'example-pipeline'}
    const pipelines = [pipeline]

    api
      .post('/pipeline-couplings')
      .reply(201, coupling)
      .get('/pipelines')
      .query(true)
      .reply(200, pipelines)

    await runCommandHelper(AddCommand, [
      '--app',
      'example-app',
      'example-pipeline',
    ])

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.contain('Adding ⬢ example-app to example-pipeline pipeline as development... done')
  })

  it('adds a pipeline by disambiguating by user choice of identically named pipelines', async function () {
    // this `stub` overrides the prompt function,
    // simulating that the user picked the identical
    // pipeline value with id: '0987' for the pipeline
    // question
    sinon.stub(inquirer, 'prompt').callsFake(function (questions: any) {
      const question = questions[0]

      if (question && question.name === 'pipeline') {
        return Promise.resolve({
          pipeline: {
            id: '0987',
            name: 'pipeline-with-identical-name-to-another-pipeline',
          },
        })
      }

      return Promise.resolve({})
    })

    const coupling = {id: '0123', stage: 'development'}

    const firstIdenticallyNamedPipeline = {id: '0123', name: 'pipeline-with-identical-name-to-another-pipeline'}
    const secondIdenticallyNamedPipeline = {id: '0987', name: 'pipeline-with-identical-name-to-another-pipeline'}

    // by returning to a query for pipeline names with
    // multiple results we trigger a choice from the
    // user to disambiguate between the choices
    const pipelinesWithIdenticalNames = [
      firstIdenticallyNamedPipeline,
      secondIdenticallyNamedPipeline,
    ]

    api
      .post('/pipeline-couplings')
      .reply(201, coupling)
      .get('/pipelines')
      .query({eq: {name: 'pipeline-with-identical-name-to-another-pipeline'}})
      .reply(200, pipelinesWithIdenticalNames)

    await runCommandHelper(AddCommand, [
      '--app',
      'example-app',
      '--stage',
      'staging',
      'pipeline-with-identical-name-to-another-pipeline',
    ])

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.contain('Adding ⬢ example-app to pipeline-with-identical-name-to-another-pipeline pipeline as staging... done')
  })
})
