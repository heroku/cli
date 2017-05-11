const api = require('./heroku-api')
const cli = require('heroku-cli-util')
const disambiguatePipeline = require('heroku-pipelines').disambiguatePipeline

function * getPipeline (context, client) {
  let pipeline = context.flags.pipeline

  let pipelineOrApp = pipeline || context.app
  if (!pipelineOrApp) cli.exit(1, 'Required flag:  --pipeline PIPELINE or --app APP')

  if (pipeline) {
    pipeline = yield disambiguatePipeline(client, pipeline)
  } else {
    const coupling = yield api.pipelineCoupling(client, context.app)
    pipeline = coupling.pipeline
  }

  return pipeline
}

module.exports = {
  getPipeline
}
