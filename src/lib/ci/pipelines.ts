import {APIClient, configRemote, getGitRemotes} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core/ux'
import inquirer from 'inquirer'

import {uuidValidate} from '../utils/uuid-validate.js'

export class PipelineService {
  constructor(private herokuAPI: APIClient) {
    // Constructor required to inject herokuAPI dependency
  }

  async disambiguatePipeline(pipelineIDOrName: string) {
    const headers = {Accept: 'application/vnd.heroku+json; version=3.pipelines'}

    if (uuidValidate(pipelineIDOrName)) {
      const {body: pipeline} = await this.herokuAPI.get<Heroku.Pipeline>(`/pipelines/${pipelineIDOrName}`, {headers})
      return pipeline
    }

    const {body: pipelines} = await this.herokuAPI.get<Heroku.Pipeline>(`/pipelines?eq[name]=${pipelineIDOrName}`, {headers})

    let choices
    switch (pipelines.length) {
      case 0: {
        ux.error('Pipeline not found')
        break
      }

      case 1: {
        return pipelines[0]
      }

      default: {
        choices = pipelines.map((x: Heroku.Pipeline) => ({name: new Date(x.created_at!), value: x}))

        return this.promptForPipeline(pipelineIDOrName, choices)
      }
    }
  }

  async getPipeline(flags: {app: null | string; pipeline: null | string; remote?: null | string}) {
    let pipeline

    // Resolve app from --remote flag or heroku.remote git config when --pipeline and --app are absent
    const resolvedApp = flags.app ?? this.resolveAppFromRemote(flags.remote) ?? null

    if (!flags.pipeline && !resolvedApp) {
      ux.error('Required flag:  --pipeline PIPELINE or --app APP')
    }

    if (flags && flags.pipeline) {
      pipeline = await this.disambiguatePipeline(flags.pipeline)

      if (pipeline.pipeline) {
        pipeline = pipeline.pipeline
      } // in case prompt returns an object like { pipeline: { ... } }
    } else {
      const {body: coupling} = await this.herokuAPI.get<Heroku.PipelineCoupling>(`/apps/${resolvedApp}/pipeline-couplings`)
      if ((coupling) && (coupling.pipeline)) {
        pipeline = coupling.pipeline
      } else {
        ux.error(`No pipeline found with application ${resolvedApp}`)
      }
    }

    return pipeline
  }

  promptForPipeline(pipelineIDOrName: string, choices: {name: string, value: Heroku.Pipeline}[]) {
    const questions = [{
      choices,
      message: `Which ${pipelineIDOrName} pipeline?`,
      name: 'pipeline',
      type: 'list',
    }]

    return inquirer.prompt(questions)
  }

  /**
   * Resolves an app name from a git remote name or heroku.remote git config.
   * Returns undefined if no matching heroku git remote is found.
   */
  protected resolveAppFromRemote(remote: null | string | undefined): string | undefined {
    const remoteName = remote || configRemote()
    if (!remoteName) return undefined
    const gitRemotes = getGitRemotes(remoteName)
    return gitRemotes.length > 0 ? gitRemotes[0].app : undefined
  }
}

// Export standalone functions for backward compatibility
export function promptForPipeline(pipelineIDOrName: string, choices: {name: string, value: Heroku.Pipeline}[]) {
  const service = new PipelineService({} as APIClient)
  return service.promptForPipeline(pipelineIDOrName, choices)
}

export async function disambiguatePipeline(pipelineIDOrName: string, herokuAPI: APIClient) {
  const service = new PipelineService(herokuAPI)
  return service.disambiguatePipeline(pipelineIDOrName)
}

export async function getPipeline(flags: any, herokuAPI: APIClient) {
  const service = new PipelineService(herokuAPI)
  return service.getPipeline(flags)
}
