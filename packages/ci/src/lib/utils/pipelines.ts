import {prompt} from 'inquirer'
import {isUUID} from 'validator'

import {Command} from '@heroku-cli/command'

import * as Heroku from '@heroku-cli/schema'

export async function getPipeline(flags: any, command: Command) {
  let pipeline

  if ((!flags.pipeline) && (!flags.app)) {
    command.error('Required flag:  --pipeline PIPELINE or --app APP')
  }

  if (flags && flags.pipeline) {
    pipeline = await disambiguatePipeline(flags.pipeline, command)

    if (pipeline.pipeline) { pipeline = pipeline.pipeline } // in case prompt returns an object like { pipeline: { ... } }
  } else {
    const {body: coupling} = await command.heroku.get<Heroku.PipelineCoupling>(`/apps/${flags.app}/pipeline-couplings`)
    if ((coupling) && (coupling.pipeline)) {
      pipeline = coupling.pipeline
    } else {
      command.error(`No pipeline found with application ${flags.app}`)
    }
  }

  return pipeline
}
export async function disambiguatePipeline(pipelineIDOrName: any, command: Command) {
  const headers = {Accept: 'application/vnd.heroku+json; version=3.pipelines'}

  if (isUUID(pipelineIDOrName)) {
    const {body: pipeline} = await command.heroku.get<Heroku.Pipeline>(`/pipelines/${pipelineIDOrName}`, {headers})
    return pipeline
  } else {
    const {body: pipelines} = await command.heroku.get<Heroku.Pipeline>(`/pipelines?eq[name]=${pipelineIDOrName}`, {headers})

    switch (pipelines.length) {
      case 0:
        command.error('Pipeline not found')
        break
      case 1:
        return pipelines[0]
      default:
        let choices = pipelines.map(function (x: any) { return {name: new Date(x.created_at), value: x} })
        let questions = [{
          type: 'list',
          name: 'pipeline',
            message: `Which ${pipelineIDOrName} pipeline?`,
            choices
        }]

        return prompt(questions)
    }
  }
}
