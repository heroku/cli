const api = require('./heroku-api')
const cli = require('heroku-cli-util')
const disambiguatePipeline = require('./disambiguate')

async function getPipeline(context, client) {
  let pipeline = context.flags.pipeline

  let pipelineOrApp = pipeline || context.app
  if (!pipelineOrApp) cli.exit(1, 'Required flag:  --pipeline PIPELINE or --app APP')

  if (pipeline) {
    pipeline = await disambiguatePipeline(client, pipeline)
  } else {
    const coupling = await api.pipelineCoupling(client, context.app)
    pipeline = coupling.pipeline
  }

  return pipeline
}

// Deep get in an object, returning undefined if the path is invalid
// e.g. get([{ foo: { bar: 'baz' } } ], 0, 'foo', 'bar') => 'baz'
//
function dig(obj, ...path) {
  const key = path.shift()
  // eslint-disable-next-line no-eq-null, eqeqeq
  if (key == null || obj == null) {
    return
  }

  const val = obj[key]
  if (typeof val === 'object') {
    return dig(val, ...path)
  }

  return val
}

module.exports = {
  getPipeline,
  dig,
}
