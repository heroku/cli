'use strict'
const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/heroku-api')
const source = require('../../lib/source')
const TestRun = require('../../lib/test-run')
const Utils = require('../../lib/utils')

function* run (context, heroku) {
  const pipeline = yield Utils.getPipeline(context, heroku)
  let sourceTestRun

  if (context.args.number) {
    sourceTestRun = yield cli.action(`Fetching test run #${context.args.number}`, co(function* () {
      return yield api.testRun(heroku, pipeline.id, context.args.number)
    }))
  } else {
    sourceTestRun = yield cli.action(`Fetching latest test run`, co(function* () {
      return yield api.latestTestRun(heroku, pipeline.id)
    }))
    cli.log(`Rerunning test run #${sourceTestRun.number}...`)
  }

  const sourceBlobUrl = yield cli.action('Preparing source', co(function* () {
    return yield source.createSourceBlob(sourceTestRun.commit_sha, context, heroku)
  }))

  const pipelineRepository = yield api.pipelineRepository(heroku, pipeline.id)
  const organization = pipelineRepository.organization &&
                       pipelineRepository.organization.name

  const testRun = yield cli.action('Starting test run', co(function* () {
    return yield api.createTestRun(heroku, {
      commit_branch: sourceTestRun.commit_branch,
      commit_message: sourceTestRun.commit_message,
      commit_sha: sourceTestRun.commit_sha,
      pipeline: pipeline.id,
      organization,
      source_blob_url: sourceBlobUrl
    })
  }))

  return yield TestRun.displayAndExit(pipeline, testRun.number, { heroku })
}

module.exports = {
  topic: 'ci',
  command: 'rerun',
  wantsApp: true,
  needsAuth: true,
  description: 'rerun tests against current directory',
  help: 'uploads the contents of the current directory, using git archive, to Heroku and runs the tests',
  args: [{ name: 'number', optional: true }],
  flags: [
    {
      name: 'pipeline',
      char: 'p',
      hasValue: true,
      description: 'pipeline'
    }
  ],
  run: cli.command(co.wrap(run))
}
