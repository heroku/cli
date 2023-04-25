// copied from plugin-pipelines-v5
let validator = require('validator')
let inquirer = require('inquirer')
let api = require('./api')

async function disambiguate(heroku, pipelineIDOrName) {
  var pipeline
  if (validator.isUUID(pipelineIDOrName)) {
    pipeline = await api.getPipeline(heroku, pipelineIDOrName)
  } else {
    let pipelines = await api.findPipelineByName(heroku, pipelineIDOrName)
    if (pipelines.length === 0) {
      throw new Error('Pipeline not found')
    } else if (pipelines.length === 1) {
      pipeline = pipelines[0]
    } else {
      // Disambiguate
      let choices = pipelines.map(function (x) {
        return {name: new Date(x.created_at), value: x}
      })
      let questions = [{
        type: 'list',
        name: 'pipeline',
        message: `Which ${pipelineIDOrName} pipeline?`,
        choices: choices,
      }]
      pipeline = await new Promise(function (resolve, reject) {
        inquirer.prompt(questions, function (answers) {
          if (answers.pipeline) resolve(answers.pipeline)
          // eslint-disable-next-line prefer-promise-reject-errors
          else reject('Must pick a pipeline')
        })
      })
    }
  }

  return pipeline
}

module.exports = disambiguate
