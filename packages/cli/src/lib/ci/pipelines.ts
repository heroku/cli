import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import inquirer from 'inquirer'
import validator from 'validator'
import {ux} from '@oclif/core'

export class PipelineService {
  // eslint-disable-next-line no-useless-constructor
  constructor(private herokuAPI: APIClient) {
    // Constructor required to inject herokuAPI dependency
  }

  promptForPipeline(pipelineIDOrName: string, choices: {name: string, value: Heroku.Pipeline}[]) {
    const questions = [{
      type: 'list',
      name: 'pipeline',
      message: `Which ${pipelineIDOrName} pipeline?`,
      choices,
    }]

    return inquirer.prompt(questions)
  }

  async disambiguatePipeline(pipelineIDOrName: any) {
    const headers = {Accept: 'application/vnd.heroku+json; version=3.pipelines'}

    if (validator.isUUID(pipelineIDOrName)) {
      const {body: pipeline} = await this.herokuAPI.get<Heroku.Pipeline>(`/pipelines/${pipelineIDOrName}`, {headers})
      return pipeline
    }

    const {body: pipelines} = await this.herokuAPI.get<Heroku.Pipeline>(`/pipelines?eq[name]=${pipelineIDOrName}`, {headers})

    let choices
    switch (pipelines.length) {
    case 0:
      ux.error('Pipeline not found')
      break
    case 1:
      return pipelines[0]
    default:
      choices = pipelines.map(function (x: Heroku.Pipeline) {
        return {name: new Date(x.created_at!), value: x}
      })

      return this.promptForPipeline(pipelineIDOrName, choices)
    }
  }

  async getPipeline(flags: any) {
    let pipeline

    if ((!flags.pipeline) && (!flags.app)) {
      ux.error('Required flag:  --pipeline PIPELINE or --app APP')
    }

    if (flags && flags.pipeline) {
      pipeline = await this.disambiguatePipeline(flags.pipeline)

      if (pipeline.pipeline) {
        pipeline = pipeline.pipeline
      } // in case prompt returns an object like { pipeline: { ... } }
    } else {
      const {body: coupling} = await this.herokuAPI.get<Heroku.PipelineCoupling>(`/apps/${flags.app}/pipeline-couplings`)
      if ((coupling) && (coupling.pipeline)) {
        pipeline = coupling.pipeline
      } else {
        ux.error(`No pipeline found with application ${flags.app}`)
      }
    }

    return pipeline
  }
}

// Export standalone functions for backward compatibility
export function promptForPipeline(pipelineIDOrName: string, choices: {name: string, value: Heroku.Pipeline}[]) {
  const service = new PipelineService({} as APIClient)
  return service.promptForPipeline(pipelineIDOrName, choices)
}

export async function disambiguatePipeline(pipelineIDOrName: any, herokuAPI: APIClient) {
  const service = new PipelineService(herokuAPI)
  return service.disambiguatePipeline(pipelineIDOrName)
}

export async function getPipeline(flags: any, herokuAPI: APIClient) {
  const service = new PipelineService(herokuAPI)
  return service.getPipeline(flags)
}
